import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../../database/schemas/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exercisesRepository: Repository<Exercise>,
  ) {}

  async create(dto: CreateExerciseDto): Promise<Exercise> {
    const existing = await this.exercisesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `An exercise with the name "${dto.name}" already exists`,
      );
    }

    const exercise = this.exercisesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      muscleGroup: dto.muscleGroup ?? null,
      equipment: dto.equipment ?? null,
    });
    return this.exercisesRepository.save(exercise);
  }

  async findAll(): Promise<Exercise[]> {
    return this.exercisesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findOne({
      where: { id },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async update(id: string, dto: UpdateExerciseDto): Promise<Exercise> {
    const exercise = await this.findOne(id);

    if (dto.name !== undefined && dto.name !== exercise.name) {
      const existing = await this.exercisesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `An exercise with the name "${dto.name}" already exists`,
        );
      }
      exercise.name = dto.name;
    }

    if (dto.description !== undefined) exercise.description = dto.description;
    if (dto.muscleGroup !== undefined) exercise.muscleGroup = dto.muscleGroup;
    if (dto.equipment !== undefined) exercise.equipment = dto.equipment;

    return this.exercisesRepository.save(exercise);
  }

  async remove(id: string): Promise<{ message: string }> {
    const exercise = await this.findOne(id);
    try {
      await this.exercisesRepository.remove(exercise);
    } catch {
      throw new ConflictException(
        `Cannot delete exercise "${exercise.name}" as it is currently used in one or more workouts`,
      );
    }
    return { message: 'Exercise deleted successfully' };
  }
}
