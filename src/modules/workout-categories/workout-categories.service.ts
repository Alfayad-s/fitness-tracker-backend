import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutCategory } from '../../database/schemas/workout-category.entity';
import { CreateWorkoutCategoryDto } from './dto/create-workout-category.dto';
import { UpdateWorkoutCategoryDto } from './dto/update-workout-category.dto';

@Injectable()
export class WorkoutCategoriesService {
  constructor(
    @InjectRepository(WorkoutCategory)
    private readonly categoriesRepository: Repository<WorkoutCategory>,
  ) {}

  async create(dto: CreateWorkoutCategoryDto): Promise<WorkoutCategory> {
    const category = this.categoriesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<WorkoutCategory[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<WorkoutCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Workout category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateWorkoutCategoryDto): Promise<WorkoutCategory> {
    const category = await this.findOne(id);

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { message: 'Workout category deleted successfully' };
  }
}
