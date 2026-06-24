import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'muscle_group', type: 'varchar', nullable: true })
  muscleGroup: string | null;

  @Column({ type: 'varchar', nullable: true })
  equipment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises: WorkoutExercise[];
}
