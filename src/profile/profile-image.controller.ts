import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { ProfileService } from './profile.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProfileImageController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  setProfileImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.setProfileImage(user, file);
  }
}
