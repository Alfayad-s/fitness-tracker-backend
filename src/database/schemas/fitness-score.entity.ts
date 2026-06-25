import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('fitness_scores')
export class FitnessScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({
    name: 'calculated_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  calculatedAt: Date;

  @ManyToOne(() => User, (user) => user.fitnessScores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
