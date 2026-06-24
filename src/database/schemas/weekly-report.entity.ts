import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('weekly_reports')
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'report_data', type: 'text', nullable: true })
  reportData: string | null;

  @Column({ name: 'generated_at', type: 'timestamptz', default: () => 'now()' })
  generatedAt: Date;

  @ManyToOne(() => User, (user) => user.weeklyReports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
