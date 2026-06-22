import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeightLog } from '../entities/weight-log.entity';
import { User } from '../entities/user.entity';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';

@Injectable()
export class WeightLogsService {
  constructor(
    @InjectRepository(WeightLog)
    private readonly weightLogsRepository: Repository<WeightLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateWeightLogDto): Promise<WeightLog> {
    const weightLog = this.weightLogsRepository.create({
      userId,
      weight: dto.weight.toString(),
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
    });

    const savedLog = await this.weightLogsRepository.save(weightLog);

    // Automatically sync profile's currentWeight
    await this.usersRepository.update(userId, {
      currentWeight: dto.weight.toString(),
    });

    return savedLog;
  }

  async findAll(userId: string): Promise<WeightLog[]> {
    return this.weightLogsRepository.find({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<WeightLog> {
    const log = await this.weightLogsRepository.findOne({
      where: { id, userId },
    });
    if (!log) {
      throw new NotFoundException(`Weight log with ID ${id} not found`);
    }
    return log;
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const log = await this.findOne(userId, id);
    await this.weightLogsRepository.remove(log);
    return { message: 'Weight log deleted successfully' };
  }
}
