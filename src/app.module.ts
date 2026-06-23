import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import aiConfig from './config/ai.config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ProfileModule } from './profile/profile.module';
import { RedisModule } from './redis/redis.module';
import { GoalsModule } from './goals/goals.module';
import { WeightLogsModule } from './weight-logs/weight-logs.module';
import { WorkoutCategoriesModule } from './workout-categories/workout-categories.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { WorkoutLogsModule } from './workout-logs/workout-logs.module';
import { MealsModule } from './meals/meals.module';
import { WaterLogsModule } from './water-logs/water-logs.module';
import { AchievementsModule } from './achievements/achievements.module';
import { FitnessScoresModule } from './fitness-scores/fitness-scores.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiWorkoutModule } from './ai-workout/ai-workout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, authConfig, mailConfig, storageConfig, aiConfig],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    ProfileModule,
    GoalsModule,
    WeightLogsModule,
    WorkoutCategoriesModule,
    ExercisesModule,
    WorkoutsModule,
    WorkoutLogsModule,
    MealsModule,
    WaterLogsModule,
    AchievementsModule,
    FitnessScoresModule,
    NotificationsModule,
    AiWorkoutModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
