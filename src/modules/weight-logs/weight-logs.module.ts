import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/schemas/user.entity';
import { WeightLog } from '../../database/schemas/weight-log.entity';
import { WeightLogsController } from './weight-logs.controller';
import { WeightLogsService } from './weight-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([WeightLog, User])],
  controllers: [WeightLogsController],
  providers: [WeightLogsService],
  exports: [WeightLogsService],
})
export class WeightLogsModule {}
