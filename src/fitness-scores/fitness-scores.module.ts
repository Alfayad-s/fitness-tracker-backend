import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FitnessScore } from '../entities/fitness-score.entity';
import { WorkoutLog } from '../entities/workout-log.entity';
import { WaterLog } from '../entities/water-log.entity';
import { Meal } from '../entities/meal.entity';
import { AchievementsModule } from '../achievements/achievements.module';
import { FitnessScoresController } from './fitness-scores.controller';
import { FitnessScoresService } from './fitness-scores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FitnessScore,
      WorkoutLog,
      WaterLog,
      Meal,
    ]),
    AchievementsModule,
  ],
  controllers: [FitnessScoresController],
  providers: [FitnessScoresService],
  exports: [FitnessScoresService],
})
export class FitnessScoresModule {}
