import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FitnessScore } from '../../database/schemas/fitness-score.entity';
import { WorkoutLog } from '../../database/schemas/workout-log.entity';
import { WaterLog } from '../../database/schemas/water-log.entity';
import { Meal } from '../../database/schemas/meal.entity';
import { AchievementsModule } from '../achievements/achievements.module';
import { FitnessScoresController } from './fitness-scores.controller';
import { FitnessScoresService } from './fitness-scores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FitnessScore, WorkoutLog, WaterLog, Meal]),
    AchievementsModule,
  ],
  controllers: [FitnessScoresController],
  providers: [FitnessScoresService],
  exports: [FitnessScoresService],
})
export class FitnessScoresModule {}
