import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { FitnessScoresService } from './fitness-scores.service';

@Controller('fitness-scores')
@UseGuards(JwtAuthGuard)
export class FitnessScoresController {
  constructor(private readonly fitnessScoresService: FitnessScoresService) {}

  @Post('calculate')
  calculate(@CurrentUser() user: User) {
    return this.fitnessScoresService.calculateAndSaveScore(user.id);
  }

  @Get('latest')
  getLatest(@CurrentUser() user: User) {
    return this.fitnessScoresService.getLatestScore(user.id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: User) {
    return this.fitnessScoresService.getScoreHistory(user.id);
  }
}
