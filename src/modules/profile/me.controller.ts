import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/schemas/user.entity';
import { UpdateMeDto } from './dto/update-me.dto';
import { ProfileService } from './profile.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getMe(@CurrentUser() user: User) {
    return this.profileService.getMe(user);
  }

  @Patch()
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.profileService.updateMe(user, dto);
  }
}
