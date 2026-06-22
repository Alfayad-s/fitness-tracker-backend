import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../token.service';

@Injectable()
export class RegistrationTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Registration token is required');
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.tokenService.verifyRegistrationToken(token);
      (request as Request & { registrationEmail: string }).registrationEmail =
        payload.email;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired registration token');
    }
  }
}
