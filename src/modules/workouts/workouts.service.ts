import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { WorkoutCategory } from '../../database/schemas/workout-category.entity';
import { WorkoutExercise } from '../../database/schemas/workout-exercise.entity';
import { Workout } from '../../database/schemas/workout.entity';
import { Exercise } from '../../database/schemas/exercise.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workout)
    private readonly workoutsRepository: Repository<Workout>,
    @InjectRepository(WorkoutCategory)
    private readonly categoriesRepository: Repository<WorkoutCategory>,
    @InjectRepository(Exercise)
    private readonly exercisesRepository: Repository<Exercise>,
  ) {}

  private async validateCategory(categoryId?: string): Promise<void> {
    if (!categoryId) return;
    const categoryExists = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID ${categoryId} does not exist`,
      );
    }
  }

  private async validateExercisesExist(exerciseIds: string[]): Promise<void> {
    if (exerciseIds.length === 0) return;
    
    const uniqueIds = Array.from(new Set(exerciseIds));
    const foundExercises = await this.exercisesRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (foundExercises.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more exercise IDs do not exist in the database',
      );
    }
  }

  async create(dto: CreateWorkoutDto): Promise<Workout> {
    await this.validateCategory(dto.categoryId);

    const exerciseIds = dto.exercises?.map((ex) => ex.exerciseId) ?? [];
    await this.validateExercisesExist(exerciseIds);

    return this.dataSource.transaction(async (manager) => {
      const workout = manager.create(Workout, {
        title: dto.title,
        description: dto.description ?? null,
        categoryId: dto.categoryId ?? null,
        difficulty: dto.difficulty ?? null,
        estimatedDuration: dto.estimatedDuration ?? null,
        caloriesBurnEstimate: dto.caloriesBurnEstimate ?? null,
      });

      const savedWorkout = await manager.save(Workout, workout);

      if (dto.exercises && dto.exercises.length > 0) {
        const exercises = dto.exercises.map((ex) =>
          manager.create(WorkoutExercise, {
            workoutId: savedWorkout.id,
            exerciseId: ex.exerciseId,
            sets: ex.sets ?? null,
            reps: ex.reps ?? null,
            durationMinutes: ex.durationMinutes ?? null,
          }),
        );
        await manager.save(WorkoutExercise, exercises);
      }

      return manager.findOneOrFail(Workout, {
        where: { id: savedWorkout.id },
        relations: {
          exercises: {
            exercise: true,
          },
          category: true,
        },
      });
    });
  }

  async findAll(categoryId?: string): Promise<Workout[]> {
    const whereCondition = categoryId ? { categoryId } : {};
    return this.workoutsRepository.find({
      where: whereCondition,
      relations: {
        exercises: {
          exercise: true,
        },
        category: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workout> {
    const workout = await this.workoutsRepository.findOne({
      where: { id },
      relations: {
        exercises: {
          exercise: true,
        },
        category: true,
      },
    });
    if (!workout) {
      throw new NotFoundException(`Workout template with ID ${id} not found`);
    }
    return workout;
  }

  async update(id: string, dto: UpdateWorkoutDto): Promise<Workout> {
    const workout = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      await this.validateCategory(dto.categoryId);
    }

    if (dto.exercises !== undefined) {
      const exerciseIds = dto.exercises.map((ex) => ex.exerciseId);
      await this.validateExercisesExist(exerciseIds);
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.title !== undefined) workout.title = dto.title;
      if (dto.description !== undefined) workout.description = dto.description;
      if (dto.categoryId !== undefined) workout.categoryId = dto.categoryId;
      if (dto.difficulty !== undefined) workout.difficulty = dto.difficulty;
      if (dto.estimatedDuration !== undefined) {
        workout.estimatedDuration = dto.estimatedDuration;
      }
      if (dto.caloriesBurnEstimate !== undefined) {
        workout.caloriesBurnEstimate = dto.caloriesBurnEstimate;
      }

      const savedWorkout = await manager.save(Workout, workout);

      if (dto.exercises !== undefined) {
        // Drop and replace nested exercises
        await manager.delete(WorkoutExercise, { workoutId: id });

        if (dto.exercises.length > 0) {
          const exercises = dto.exercises.map((ex) =>
            manager.create(WorkoutExercise, {
              workoutId: id,
              exerciseId: ex.exerciseId,
              sets: ex.sets ?? null,
              reps: ex.reps ?? null,
              durationMinutes: ex.durationMinutes ?? null,
            }),
          );
          await manager.save(WorkoutExercise, exercises);
        }
      }

      return manager.findOneOrFail(Workout, {
        where: { id },
        relations: {
          exercises: {
            exercise: true,
          },
          category: true,
        },
      });
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const workout = await this.findOne(id);
    await this.workoutsRepository.remove(workout);
    return { message: 'Workout template deleted successfully' };
  }
}
