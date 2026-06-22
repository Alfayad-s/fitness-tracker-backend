import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

  private isProfileComplete(user: User): boolean {
    return !!(
      user.firstName &&
      user.lastName &&
      user.password &&
      user.fitnessGoal
    );
  }

  private async issueLoginResponse(user: User) {
    const tokens = await this.tokenService.issueAuthTokens(user);
    return {
      type: 'login' as const,
      ...tokens,
      user: this.tokenService.sanitizeUser(user),
    };
  }

  async requestOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser?.isBlocked) {
      throw new UnauthorizedException('This account has been blocked');
    }

    const purpose =
      existingUser && this.isProfileComplete(existingUser) ? 'login' : 'register';
    const otp = this.otpService.generateOtp();

    await this.otpService.storeOtp(normalizedEmail, purpose, otp);

    if (purpose === 'login') {
      await this.mailService.sendLoginOtp(normalizedEmail, otp);
    } else {
      await this.mailService.sendRegisterOtp(normalizedEmail, otp);
    }

    return {
      message: 'OTP sent to your email',
      type: purpose,
    };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser?.isBlocked) {
      throw new UnauthorizedException('This account has been blocked');
    }

    const verifiedPurpose = await this.otpService.verifyAnyOtp(
      normalizedEmail,
      otp,
    );

    if (!verifiedPurpose) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (verifiedPurpose === 'reset-password') {
      const user = await this.usersRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user || !this.isProfileComplete(user) || user.isBlocked) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      const resetPasswordToken =
        this.tokenService.createResetPasswordToken(normalizedEmail);

      return {
        type: 'reset-password' as const,
        resetPasswordToken,
        message: 'OTP verified. Set your new password.',
      };
    }

    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (user && this.isProfileComplete(user)) {
      return this.issueLoginResponse(user);
    }

    const registrationToken =
      this.tokenService.createRegistrationToken(normalizedEmail);

    return {
      type: 'register' as const,
      registrationToken,
      message: 'OTP verified. Complete your profile to finish registration.',
    };
  }

  async completeOnboarding(email: string, dto: OnboardingDto) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && this.isProfileComplete(existingUser)) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    if (existingUser) {
      const user = await this.usersRepository.save({
        ...existingUser,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        age: dto.age,
        height: dto.height.toString(),
        currentWeight: dto.currentWeight.toString(),
        fitnessGoal: dto.fitnessGoal,
        password: hashedPassword,
        isVerified: true,
        isBlocked: false,
      });

      return this.issueLoginResponse(user);
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: normalizedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        age: dto.age,
        height: dto.height.toString(),
        currentWeight: dto.currentWeight.toString(),
        fitnessGoal: dto.fitnessGoal,
        password: hashedPassword,
        isVerified: true,
        isBlocked: false,
      }),
    );

    return this.issueLoginResponse(user);
  }

  async refresh(refreshToken: string) {
    const storedToken =
      await this.tokenService.findValidRefreshToken(refreshToken);

    if (!storedToken?.user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = storedToken.user;

    if (user.isBlocked) {
      await this.tokenService.revokeRefreshToken(refreshToken);
      throw new UnauthorizedException('This account has been blocked');
    }

    return this.tokenService.rotateRefreshToken(refreshToken, user);
  }

  async logout(refreshToken: string) {
    const revoked = await this.tokenService.revokeRefreshToken(refreshToken);

    if (!revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (user && this.isProfileComplete(user) && !user.isBlocked) {
      const otp = this.otpService.generateOtp();
      await this.otpService.storeOtp(normalizedEmail, 'reset-password', otp);
      await this.mailService.sendResetPasswordOtp(normalizedEmail, otp);
    }

    return {
      message:
        'If an account exists with this email, a reset code has been sent.',
    };
  }

  async resetPassword(
    tokenEmail: string,
    email: string,
    password: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    if (tokenEmail !== normalizedEmail) {
      throw new UnauthorizedException('Email does not match reset token');
    }

    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user || !this.isProfileComplete(user)) {
      throw new UnauthorizedException('Invalid reset password request');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('This account has been blocked');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.usersRepository.update(user.id, { password: hashedPassword });
    await this.tokenService.revokeAllRefreshTokens(user.id);

    return {
      message:
        'Password reset successfully. You have been logged out from all devices.',
    };
  }
}
