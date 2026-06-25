import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { WorkoutLog } from './workout-log.entity';
import { Goal } from './goal.entity';
import { WeightLog } from './weight-log.entity';
import { Meal } from './meal.entity';
import { WaterLog } from './water-log.entity';
import { SleepLog } from './sleep-log.entity';
import { StepLog } from './step-log.entity';
import { UserAchievement } from './user-achievement.entity';
import { AiWorkoutPlan } from './ai-workout-plan.entity';
import { AiNutritionPlan } from './ai-nutrition-plan.entity';
import { AiChatHistory } from './ai-chat-history.entity';
import { WeeklyReport } from './weekly-report.entity';
import { FitnessScore } from './fitness-score.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'decimal', nullable: true })
  height: string | null;

  @Column({ name: 'current_weight', type: 'decimal', nullable: true })
  currentWeight: string | null;

  @Column({ name: 'target_weight', type: 'decimal', nullable: true })
  targetWeight: string | null;

  @Column({ name: 'activity_level', type: 'varchar', nullable: true })
  activityLevel: string | null;

  @Column({ name: 'fitness_goal', type: 'varchar', nullable: true })
  fitnessGoal: string | null;

  @Column({ name: 'profile_image', type: 'varchar', nullable: true })
  profileImage: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ name: 'google_id', type: 'varchar', unique: true, nullable: true })
  googleId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => WorkoutLog, (log) => log.user)
  workoutLogs: WorkoutLog[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @OneToMany(() => WeightLog, (log) => log.user)
  weightLogs: WeightLog[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];

  @OneToMany(() => WaterLog, (log) => log.user)
  waterLogs: WaterLog[];

  @OneToMany(() => SleepLog, (log) => log.user)
  sleepLogs: SleepLog[];

  @OneToMany(() => StepLog, (log) => log.user)
  stepLogs: StepLog[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  userAchievements: UserAchievement[];

  @OneToMany(() => AiWorkoutPlan, (plan) => plan.user)
  aiWorkoutPlans: AiWorkoutPlan[];

  @OneToMany(() => AiNutritionPlan, (plan) => plan.user)
  aiNutritionPlans: AiNutritionPlan[];

  @OneToMany(() => AiChatHistory, (chat) => chat.user)
  aiChatHistory: AiChatHistory[];

  @OneToMany(() => WeeklyReport, (report) => report.user)
  weeklyReports: WeeklyReport[];

  @OneToMany(() => FitnessScore, (score) => score.user)
  fitnessScores: FitnessScore[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
