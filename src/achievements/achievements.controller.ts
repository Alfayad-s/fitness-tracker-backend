import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.achievementsService.findAll(user.id);
  }

  @Get('streak')
  getStreak(@CurrentUser() user: User) {
    return this.achievementsService.calculateStreak(user.id);
  }
}
