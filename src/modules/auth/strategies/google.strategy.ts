import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('auth.googleClientId') || 'dummy-client-id',
      clientSecret:
        configService.get<string>('auth.googleClientSecret') ||
        'dummy-client-secret',
      callbackURL:
        configService.get<string>('auth.googleCallbackUrl') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): any {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName: name?.givenName || null,
      lastName: name?.familyName || null,
      picture: photos && photos.length > 0 ? photos[0].value : null,
    };
    done(null, user);
  }
}
