import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { FitnessScore } from '../../database/schemas/fitness-score.entity';
import { WorkoutLog } from '../../database/schemas/workout-log.entity';
import { WaterLog } from '../../database/schemas/water-log.entity';
import { Meal } from '../../database/schemas/meal.entity';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class FitnessScoresService {
  constructor(
    @InjectRepository(FitnessScore)
    private readonly fitnessScoresRepository: Repository<FitnessScore>,
    @InjectRepository(WorkoutLog)
    private readonly workoutLogsRepository: Repository<WorkoutLog>,
    @InjectRepository(WaterLog)
    private readonly waterLogsRepository: Repository<WaterLog>,
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
    private readonly achievementsService: AchievementsService,
  ) {}

  async calculateAndSaveScore(userId: string): Promise<FitnessScore> {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // 1. Workouts Points (Max 40)
    const recentWorkouts = await this.workoutLogsRepository.find({
      where: {
        userId,
        workoutDate: MoreThanOrEqual(sevenDaysAgoStr),
      },
      select: { workoutDate: true },
    });
    
    const uniqueWorkoutDays = new Set(recentWorkouts.map(w => w.workoutDate)).size;
    let workoutPoints = 0;
    if (uniqueWorkoutDays >= 4) workoutPoints = 40;
    else if (uniqueWorkoutDays === 3) workoutPoints = 30;
    else if (uniqueWorkoutDays === 2) workoutPoints = 20;
    else if (uniqueWorkoutDays === 1) workoutPoints = 10;

    // 2. Streak Points (Max 20)
    const { currentStreak } = await this.achievementsService.calculateStreak(userId);
    let streakPoints = 0;
    if (currentStreak >= 7) streakPoints = 20;
    else if (currentStreak >= 5) streakPoints = 15;
    else if (currentStreak >= 3) streakPoints = 10;
    else if (currentStreak >= 1) streakPoints = 5;

    // 3. Hydration Points (Max 20)
    const recentWater = await this.waterLogsRepository.find({
      where: {
        userId,
        loggedAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });
    
    const totalWaterMl = recentWater.reduce((sum, log) => sum + log.amountMl, 0);
    const avgWaterMl = totalWaterMl / 7;
    let hydrationPoints = 0;
    if (avgWaterMl >= 2000) hydrationPoints = 20;
    else if (avgWaterMl >= 1500) hydrationPoints = 15;
    else if (avgWaterMl >= 1000) hydrationPoints = 10;
    else if (avgWaterMl >= 500) hydrationPoints = 5;

    // 4. Nutrition Points (Max 20)
    const recentMeals = await this.mealsRepository.find({
      where: {
        userId,
        mealDate: MoreThanOrEqual(sevenDaysAgoStr),
      },
      select: { mealDate: true },
    });
    
    const uniqueMealDays = new Set(recentMeals.map(m => m.mealDate)).size;
    let nutritionPoints = 0;
    if (uniqueMealDays >= 7) nutritionPoints = 20;
    else if (uniqueMealDays >= 5) nutritionPoints = 15;
    else if (uniqueMealDays >= 3) nutritionPoints = 10;
    else if (uniqueMealDays >= 1) nutritionPoints = 5;

    const totalScore = workoutPoints + streakPoints + hydrationPoints + nutritionPoints;

    const scoreRecord = this.fitnessScoresRepository.create({
      userId,
      score: totalScore,
    });

    return this.fitnessScoresRepository.save(scoreRecord);
  }

  async getLatestScore(userId: string): Promise<FitnessScore | null> {
    return this.fitnessScoresRepository.findOne({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });
  }

  async getScoreHistory(userId: string): Promise<FitnessScore[]> {
    return this.fitnessScoresRepository.find({
      where: { userId },
      order: { calculatedAt: 'DESC' },
    });
  }
}
