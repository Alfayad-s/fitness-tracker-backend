import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'meal_type', type: 'varchar', nullable: true })
  mealType: string | null;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'int', nullable: true })
  calories: number | null;

  @Column({ type: 'decimal', nullable: true })
  protein: string | null;

  @Column({ type: 'decimal', nullable: true })
  carbs: string | null;

  @Column({ type: 'decimal', nullable: true })
  fat: string | null;

  @Column({ name: 'meal_date', type: 'date' })
  mealDate: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
