import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutLog } from '../entities/workout-log.entity';
import { Workout } from '../entities/workout.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';

@Injectable()
export class WorkoutLogsService {
  constructor(
    @InjectRepository(WorkoutLog)
    private readonly workoutLogsRepository: Repository<WorkoutLog>,
    @InjectRepository(Workout)
    private readonly workoutsRepository: Repository<Workout>,
  ) {}

  async create(userId: string, dto: CreateWorkoutLogDto): Promise<WorkoutLog> {
    const workout = await this.workoutsRepository.findOne({
      where: { id: dto.workoutId },
    });

    if (!workout) {
      throw new BadRequestException(`Workout template with ID ${dto.workoutId} does not exist`);
    }

    const workoutLog = this.workoutLogsRepository.create({
      userId,
      workoutId: dto.workoutId,
      workoutDate: dto.workoutDate ?? new Date().toISOString().split('T')[0],
      durationMinutes: dto.durationMinutes ?? workout.estimatedDuration,
      caloriesBurned: dto.caloriesBurned ?? workout.caloriesBurnEstimate,
      notes: dto.notes ?? null,
    });

    return this.workoutLogsRepository.save(workoutLog);
  }

  async findAll(userId: string): Promise<WorkoutLog[]> {
    return this.workoutLogsRepository.find({
      where: { userId },
      relations: { workout: true },
      order: { workoutDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<WorkoutLog> {
    const log = await this.workoutLogsRepository.findOne({
      where: { id, userId },
      relations: { workout: true },
    });
    if (!log) {
      throw new NotFoundException(`Workout log with ID ${id} not found`);
    }
    return log;
  }

  async update(userId: string, id: string, dto: UpdateWorkoutLogDto): Promise<WorkoutLog> {
    const log = await this.findOne(userId, id);

    if (dto.workoutDate !== undefined) log.workoutDate = dto.workoutDate;
    if (dto.durationMinutes !== undefined) log.durationMinutes = dto.durationMinutes;
    if (dto.caloriesBurned !== undefined) log.caloriesBurned = dto.caloriesBurned;
    if (dto.notes !== undefined) log.notes = dto.notes;

    return this.workoutLogsRepository.save(log);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const log = await this.findOne(userId, id);
    await this.workoutLogsRepository.remove(log);
    return { message: 'Workout log deleted successfully' };
  }
}
