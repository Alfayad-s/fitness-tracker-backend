import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterLog } from '../../database/schemas/water-log.entity';
import { CreateWaterLogDto } from './dto/create-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';

@Injectable()
export class WaterLogsService {
  constructor(
    @InjectRepository(WaterLog)
    private readonly waterLogsRepository: Repository<WaterLog>,
  ) {}

  async create(userId: string, dto: CreateWaterLogDto): Promise<WaterLog> {
    const waterLog = this.waterLogsRepository.create({
      userId,
      amountMl: dto.amountMl,
      loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
    });

    return this.waterLogsRepository.save(waterLog);
  }

  async findAll(userId: string): Promise<WaterLog[]> {
    return this.waterLogsRepository.find({
      where: { userId },
      order: { loggedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<WaterLog> {
    const log = await this.waterLogsRepository.findOne({
      where: { id, userId },
    });

    if (!log) {
      throw new NotFoundException(`Water log with ID ${id} not found`);
    }

    return log;
  }

  async update(userId: string, id: string, dto: UpdateWaterLogDto): Promise<WaterLog> {
    const log = await this.findOne(userId, id);

    if (dto.amountMl !== undefined) log.amountMl = dto.amountMl;
    if (dto.loggedAt !== undefined) log.loggedAt = new Date(dto.loggedAt);

    return this.waterLogsRepository.save(log);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const log = await this.findOne(userId, id);
    await this.waterLogsRepository.remove(log);
    return { message: 'Water log deleted successfully' };
  }
}
