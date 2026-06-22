import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RegistrationTokenPayload {
  email: string;
  purpose: 'onboarding';
}

export interface ResetPasswordTokenPayload {
  email: string;
  purpose: 'reset-password';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  createAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email!,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'auth.jwtExpiresIn',
      ) as `${number}m`,
    });
  }

  createRegistrationToken(email: string): string {
    const payload: RegistrationTokenPayload = {
      email: email.toLowerCase(),
      purpose: 'onboarding',
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'auth.registrationJwtExpiresIn',
      ) as `${number}m`,
    });
  }

  verifyRegistrationToken(token: string): RegistrationTokenPayload {
    const payload = this.jwtService.verify<RegistrationTokenPayload>(token, {
      secret: this.configService.get<string>('auth.jwtSecret'),
    });
    if (payload.purpose !== 'onboarding') {
      throw new Error('Invalid registration token');
    }
    return payload;
  }

  createResetPasswordToken(email: string): string {
    const payload: ResetPasswordTokenPayload = {
      email: email.toLowerCase(),
      purpose: 'reset-password',
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'auth.registrationJwtExpiresIn',
      ) as `${number}m`,
    });
  }

  verifyResetPasswordToken(token: string): ResetPasswordTokenPayload {
    const payload = this.jwtService.verify<ResetPasswordTokenPayload>(token, {
      secret: this.configService.get<string>('auth.jwtSecret'),
    });
    if (payload.purpose !== 'reset-password') {
      throw new Error('Invalid reset password token');
    }
    return payload;
  }

  async createRefreshToken(user: User): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresInDays =
      this.configService.get<number>('auth.refreshTokenExpiresInDays') ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.refreshTokensRepository.save({
      userId: user.id,
      token,
      expiresAt,
    });

    return token;
  }

  async issueAuthTokens(user: User) {
    const accessToken = this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async findValidRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokensRepository.findOne({
      where: { token },
      relations: { user: true },
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokensRepository.delete({ id: refreshToken.id });
      return null;
    }

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const result = await this.refreshTokensRepository.delete({ token });
    return (result.affected ?? 0) > 0;
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokensRepository.delete({ userId });
  }

  async rotateRefreshToken(
    oldToken: string,
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    await this.refreshTokensRepository.delete({ token: oldToken });
    const accessToken = this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    return { accessToken, refreshToken };
  }

  sanitizeUser(user: User) {
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}
