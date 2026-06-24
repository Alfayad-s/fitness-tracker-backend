import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { User } from '../../../database/schemas/user.entity';
import { AiWorkoutService } from './ai-workout.service';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@Controller('ai-workout')
@UseGuards(JwtAuthGuard)
export class AiWorkoutController {
  constructor(private readonly aiWorkoutService: AiWorkoutService) {}

  @Post('generate')
  generate(@CurrentUser() user: User, @Body() dto: GenerateWorkoutDto) {
    return this.aiWorkoutService.generatePlan(user.id, dto);
  }

  @Get('history')
  getHistory(@CurrentUser() user: User) {
    return this.aiWorkoutService.getHistory(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.aiWorkoutService.findOne(user.id, id);
  }
}
