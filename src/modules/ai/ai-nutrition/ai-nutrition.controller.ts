import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { User } from '../../../database/schemas/user.entity';
import { AiNutritionService } from './ai-nutrition.service';
import { GenerateNutritionDto } from './dto/generate-nutrition.dto';

@Controller('ai-nutrition')
@UseGuards(JwtAuthGuard)
export class AiNutritionController {
  constructor(private readonly aiNutritionService: AiNutritionService) {}

  @Post('generate')
  generate(@CurrentUser() user: User, @Body() dto: GenerateNutritionDto) {
    return this.aiNutritionService.generatePlan(user.id, dto);
  }

  @Get('history')
  getHistory(@CurrentUser() user: User) {
    return this.aiNutritionService.getHistory(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.aiNutritionService.findOne(user.id, id);
  }
}
