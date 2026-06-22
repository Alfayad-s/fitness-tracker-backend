import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('sleep_logs')
export class SleepLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'sleep_hours', type: 'decimal', nullable: true })
  sleepHours: string | null;

  @Column({ name: 'sleep_quality', type: 'varchar', nullable: true })
  sleepQuality: string | null;

  @Column({ name: 'sleep_date', type: 'date' })
  sleepDate: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.sleepLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
