import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalStatus } from './goals.constants';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalsRepository.create({
      userId,
      goalType: dto.goalType,
      targetValue: dto.targetValue.toString(),
      currentValue: (dto.currentValue ?? 0).toString(),
      startDate: dto.startDate ?? new Date().toISOString().split('T')[0],
      targetDate: dto.targetDate || null,
      status: dto.status ?? GoalStatus.IN_PROGRESS,
    });
    return this.goalsRepository.save(goal);
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    return goal;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(userId, id);

    if (dto.targetValue !== undefined) goal.targetValue = dto.targetValue.toString();
    if (dto.currentValue !== undefined) goal.currentValue = dto.currentValue.toString();
    if (dto.startDate !== undefined) goal.startDate = dto.startDate;
    if (dto.targetDate !== undefined) goal.targetDate = dto.targetDate;
    if (dto.status !== undefined) goal.status = dto.status;

    return this.goalsRepository.save(goal);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const goal = await this.findOne(userId, id);
    await this.goalsRepository.remove(goal);
    return { message: 'Goal deleted successfully' };
  }
}
// 
