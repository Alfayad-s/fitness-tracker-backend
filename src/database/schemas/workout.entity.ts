import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutCategory } from './workout-category.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { WorkoutLog } from './workout-log.entity';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  difficulty: string | null;

  @Column({ name: 'estimated_duration', type: 'int', nullable: true })
  estimatedDuration: number | null;

  @Column({ name: 'calories_burn_estimate', type: 'int', nullable: true })
  caloriesBurnEstimate: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => WorkoutCategory, (category) => category.workouts, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: WorkoutCategory | null;

  @OneToMany(() => WorkoutExercise, (exercise) => exercise.workout)
  exercises: WorkoutExercise[];

  @OneToMany(() => WorkoutLog, (log) => log.workout)
  workoutLogs: WorkoutLog[];
}
