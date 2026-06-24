import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterLog } from '../../database/schemas/water-log.entity';
import { WaterLogsController } from './water-logs.controller';
import { WaterLogsService } from './water-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterLog])],
  controllers: [WaterLogsController],
  providers: [WaterLogsService],
  exports: [WaterLogsService],
})
export class WaterLogsModule {}
