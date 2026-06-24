import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import authConfig from '../../config/auth.config';
import { RefreshToken } from '../../database/schemas/refresh-token.entity';
import { User } from '../../database/schemas/user.entity';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegistrationTokenGuard } from '../../common/guards/registration-token.guard';
import { ResetPasswordTokenGuard } from '../../common/guards/reset-password-token.guard';
import { OtpService } from './otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
      }),
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    RegistrationTokenGuard,
    ResetPasswordTokenGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
