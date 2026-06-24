import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from '../../database/schemas/achievement.entity';
import { UserAchievement } from '../../database/schemas/user-achievement.entity';
import { WorkoutLog } from '../../database/schemas/workout-log.entity';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      WorkoutLog,
    ]),
    NotificationsModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
