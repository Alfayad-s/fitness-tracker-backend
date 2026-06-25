import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/request-otp.dto';
import { RegistrationTokenGuard } from '../../common/guards/registration-token.guard';
import { ResetPasswordTokenGuard } from '../../common/guards/reset-password-token.guard';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';

type RegistrationRequest = Request & { registrationEmail: string };
type ResetPasswordRequest = Request & { resetPasswordEmail: string };

interface GoogleRequest extends Request {
  user: {
    googleId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    picture: string | null;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('onboarding')
  @UseGuards(RegistrationTokenGuard)
  completeOnboarding(
    @Req() req: RegistrationRequest,
    @Body() dto: OnboardingDto,
  ) {
    return this.authService.completeOnboarding(req.registrationEmail, dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @UseGuards(ResetPasswordTokenGuard)
  resetPassword(
    @Req() req: ResetPasswordRequest,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      req.resetPasswordEmail,
      dto.email,
      dto.password,
    );
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Handled by guard redirection to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: GoogleRequest, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl =
      this.configService.get<string>('auth.frontendUrl') ||
      'http://localhost:3000';

    if (result.type === 'login') {
      return res.redirect(
        `${frontendUrl}/oauth-callback?type=login&accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } else {
      return res.redirect(
        `${frontendUrl}/oauth-callback?type=register&registrationToken=${result.registrationToken}&message=${encodeURIComponent(result.message)}`,
      );
    }
  }

  @Post('google/token')
  async googleTokenAuth(@Body() dto: { token: string }) {
    return this.authService.authenticateGoogleToken(dto.token);
  }
}
