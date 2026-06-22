import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { WeightLog } from '../entities/weight-log.entity';
import { WeightLogsController } from './weight-logs.controller';
import { WeightLogsService } from './weight-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([WeightLog, User])],
  controllers: [WeightLogsController],
  providers: [WeightLogsService],
  exports: [WeightLogsService],
})
export class WeightLogsModule {}
