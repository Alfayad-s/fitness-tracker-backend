import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiWorkoutPlan } from '../../../database/schemas/ai-workout-plan.entity';
import { User } from '../../../database/schemas/user.entity';
import { AiWorkoutController } from './ai-workout.controller';
import { AiWorkoutService } from './ai-workout.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiWorkoutPlan, User])],
  controllers: [AiWorkoutController],
  providers: [AiWorkoutService],
  exports: [AiWorkoutService],
})
export class AiWorkoutModule {}
