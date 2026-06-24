import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { RedisService } from '../../infrastructure/redis/redis.service';

export type OtpPurpose = 'login' | 'register' | 'reset-password';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private key(email: string, purpose: OtpPurpose): string {
    return `otp:${purpose}:${email.toLowerCase()}`;
  }

  generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async storeOtp(
    email: string,
    purpose: OtpPurpose,
    otp: string,
  ): Promise<void> {
    const ttl = this.configService.get<number>('redis.otpTtlSeconds') ?? 600;
    await this.redisService.set(this.key(email, purpose), otp, ttl);
  }

  async verifyOtp(
    email: string,
    purpose: OtpPurpose,
    otp: string,
  ): Promise<boolean> {
    const stored = await this.redisService.get(this.key(email, purpose));
    if (!stored || stored !== otp) {
      return false;
    }
    await this.redisService.del(this.key(email, purpose));
    return true;
  }

  async verifyAnyOtp(email: string, otp: string): Promise<OtpPurpose | null> {
    if (await this.verifyOtp(email, 'reset-password', otp)) {
      return 'reset-password';
    }
    if (await this.verifyOtp(email, 'login', otp)) {
      return 'login';
    }
    if (await this.verifyOtp(email, 'register', otp)) {
      return 'register';
    }
    return null;
  }
}
