import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import aiConfig from './config/ai.config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './modules/health/health.controller';
import { ProfileModule } from './modules/profile/profile.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { GoalsModule } from './modules/goals/goals.module';
import { WeightLogsModule } from './modules/weight-logs/weight-logs.module';
import { WorkoutCategoriesModule } from './modules/workout-categories/workout-categories.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { WorkoutLogsModule } from './modules/workout-logs/workout-logs.module';
import { MealsModule } from './modules/meals/meals.module';
import { WaterLogsModule } from './modules/water-logs/water-logs.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { FitnessScoresModule } from './modules/fitness-scores/fitness-scores.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiWorkoutModule } from './modules/ai/ai-workout/ai-workout.module';

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
