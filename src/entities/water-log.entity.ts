import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('water_logs')
export class WaterLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'amount_ml', type: 'int' })
  amountMl: number;

  @Column({ name: 'logged_at', type: 'timestamptz', default: () => 'now()' })
  loggedAt: Date;

  @ManyToOne(() => User, (user) => user.waterLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
