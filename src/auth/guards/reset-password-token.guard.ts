import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../token.service';

@Injectable()
export class ResetPasswordTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Reset password token is required');
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.tokenService.verifyResetPasswordToken(token);
      (request as Request & { resetPasswordEmail: string }).resetPasswordEmail =
        payload.email;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset password token');
    }
  }
}
