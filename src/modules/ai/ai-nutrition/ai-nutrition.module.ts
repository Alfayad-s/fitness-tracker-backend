import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiNutritionPlan } from '../../../database/schemas/ai-nutrition-plan.entity';
import { User } from '../../../database/schemas/user.entity';
import { AiNutritionController } from './ai-nutrition.controller';
import { AiNutritionService } from './ai-nutrition.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiNutritionPlan, User])],
  controllers: [AiNutritionController],
  providers: [AiNutritionService],
  exports: [AiNutritionService],
})
export class AiNutritionModule {}
