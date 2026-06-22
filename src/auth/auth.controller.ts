import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/request-otp.dto';
import { RegistrationTokenGuard } from './guards/registration-token.guard';
import { ResetPasswordTokenGuard } from './guards/reset-password-token.guard';

type RegistrationRequest = Request & { registrationEmail: string };
type ResetPasswordRequest = Request & { resetPasswordEmail: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
