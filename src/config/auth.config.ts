import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  registrationJwtExpiresIn: process.env.REGISTRATION_JWT_EXPIRES_IN ?? '30m',
  refreshTokenExpiresInDays: parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '7',
    10,
  ),
}));
