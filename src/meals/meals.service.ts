import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from '../entities/meal.entity';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
  ) {}

  async create(userId: string, dto: CreateMealDto): Promise<Meal> {
    const meal = this.mealsRepository.create({
      userId,
      mealType: dto.mealType,
      title: dto.title,
      calories: dto.calories,
      protein: dto.protein !== undefined ? dto.protein.toString() : null,
      carbs: dto.carbs !== undefined ? dto.carbs.toString() : null,
      fat: dto.fat !== undefined ? dto.fat.toString() : null,
      mealDate: dto.mealDate ?? new Date().toISOString().split('T')[0],
    });

    return this.mealsRepository.save(meal);
  }

  async findAll(userId: string): Promise<Meal[]> {
    return this.mealsRepository.find({
      where: { userId },
      order: { mealDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Meal> {
    const meal = await this.mealsRepository.findOne({
      where: { id, userId },
    });

    if (!meal) {
      throw new NotFoundException(`Meal log with ID ${id} not found`);
    }

    return meal;
  }

  async update(userId: string, id: string, dto: UpdateMealDto): Promise<Meal> {
    const meal = await this.findOne(userId, id);

    if (dto.mealType !== undefined) meal.mealType = dto.mealType;
    if (dto.title !== undefined) meal.title = dto.title;
    if (dto.calories !== undefined) meal.calories = dto.calories;
    if (dto.protein !== undefined) meal.protein = dto.protein !== null ? dto.protein.toString() : null;
    if (dto.carbs !== undefined) meal.carbs = dto.carbs !== null ? dto.carbs.toString() : null;
    if (dto.fat !== undefined) meal.fat = dto.fat !== null ? dto.fat.toString() : null;
    if (dto.mealDate !== undefined) meal.mealDate = dto.mealDate;

    return this.mealsRepository.save(meal);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const meal = await this.findOne(userId, id);
    await this.mealsRepository.remove(meal);
    return { message: 'Meal log deleted successfully' };
  }
}
