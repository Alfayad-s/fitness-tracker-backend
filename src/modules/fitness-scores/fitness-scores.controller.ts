import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/schemas/user.entity';
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
