import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../../database/schemas/achievement.entity';
import { UserAchievement } from '../../database/schemas/user-achievement.entity';
import { WorkoutLog } from '../../database/schemas/workout-log.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementsRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementsRepository: Repository<UserAchievement>,
    @InjectRepository(WorkoutLog)
    private readonly workoutLogsRepository: Repository<WorkoutLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async calculateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const logs = await this.workoutLogsRepository.find({
      where: { userId },
      select: { workoutDate: true },
      order: { workoutDate: 'ASC' },
    });

    if (logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Get unique workout dates
    const uniqueDates = Array.from(new Set(logs.map(log => log.workoutDate))).sort();

    // Map date strings to UTC Dates (ignoring local times for strict daily logic)
    const dates = uniqueDates.map(d => new Date(d));

    let longestStreak = 1;
    let runningStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const diffTime = dates[i].getTime() - dates[i - 1].getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
        runningStreak = 1;
      }
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }

    // Calculate current streak
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasWorkedOutToday = uniqueDates.includes(todayStr);
    const hasWorkedOutYesterday = uniqueDates.includes(yesterdayStr);

    let currentStreak = 0;
    if (hasWorkedOutToday || hasWorkedOutYesterday) {
      currentStreak = 1;
      const checkDate = hasWorkedOutToday ? new Date(todayStr) : new Date(yesterdayStr);

      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkDateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak };
  }

  async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    const earned = await this.userAchievementsRepository.find({
      where: { userId },
      select: { achievementId: true },
    });
    const earnedIds = new Set(earned.map(e => e.achievementId));

    const allAchievements = await this.achievementsRepository.find();
    const isEarned = (id: string) => earnedIds.has(id);

    const totalWorkouts = await this.workoutLogsRepository.count({ where: { userId } });
    const { longestStreak } = await this.calculateStreak(userId);

    const allLogs = await this.workoutLogsRepository.find({
      where: { userId },
      select: { createdAt: true },
    });

    const hasEarlyBirdWorkout = allLogs.some(log => {
      const hours = new Date(log.createdAt).getHours();
      return hours < 8;
    });

    const hasNightOwlWorkout = allLogs.some(log => {
      const hours = new Date(log.createdAt).getHours();
      return hours >= 20;
    });

    const newlyAwarded: UserAchievement[] = [];

    const award = async (achievementId: string, title: string, message: string | null) => {
      if (isEarned(achievementId)) return;

      const userAchievement = this.userAchievementsRepository.create({
        userId,
        achievementId,
      });
      const savedUA = await this.userAchievementsRepository.save(userAchievement);
      newlyAwarded.push(savedUA);

      await this.notificationsService.create(
        userId,
        `Achievement Unlocked: ${title}!`,
        message,
        'ACHIEVEMENT',
      );
    };

    for (const achievement of allAchievements) {
      if (achievement.id === 'a0000000-0000-0000-0000-000000000001' && totalWorkouts >= 1) {
        await award(achievement.id, achievement.title, achievement.description);
      }
      if (achievement.id === 'a0000000-0000-0000-0000-000000000002' && longestStreak >= 3) {
        await award(achievement.id, achievement.title, achievement.description);
      }
      if (achievement.id === 'a0000000-0000-0000-0000-000000000003' && longestStreak >= 7) {
        await award(achievement.id, achievement.title, achievement.description);
      }
      if (achievement.id === 'a0000000-0000-0000-0000-000000000004' && totalWorkouts >= 10) {
        await award(achievement.id, achievement.title, achievement.description);
      }
      if (achievement.id === 'a0000000-0000-0000-0000-000000000005' && hasEarlyBirdWorkout) {
        await award(achievement.id, achievement.title, achievement.description);
      }
      if (achievement.id === 'a0000000-0000-0000-0000-000000000006' && hasNightOwlWorkout) {
        await award(achievement.id, achievement.title, achievement.description);
      }
    }

    return newlyAwarded;
  }

  async findAll(userId: string): Promise<any[]> {
    const all = await this.achievementsRepository.find({
      order: { title: 'ASC' },
    });
    const earned = await this.userAchievementsRepository.find({
      where: { userId },
    });
    const earnedMap = new Map(earned.map(e => [e.achievementId, e.earnedAt]));

    return all.map(achievement => ({
      ...achievement,
      earned: earnedMap.has(achievement.id),
      earnedAt: earnedMap.get(achievement.id) || null,
    }));
  }

  async findUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementsRepository.find({
      where: { userId },
      relations: { achievement: true },
      order: { earnedAt: 'DESC' },
    });
  }
}
