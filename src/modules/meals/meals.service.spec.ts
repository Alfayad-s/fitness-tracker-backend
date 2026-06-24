import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealsService } from './meals.service';
import { Meal } from '../../database/schemas/meal.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

describe('MealsService', () => {
  let service: MealsService;
  let repository: Repository<Meal>;

  const mockMealRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        {
          provide: getRepositoryToken(Meal),
          useValue: mockMealRepository,
        },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
    repository = module.get<Repository<Meal>>(getRepositoryToken(Meal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a meal log', async () => {
      const userId = 'user-uuid';
      const dto: CreateMealDto = {
        mealType: 'Breakfast',
        title: 'Oatmeal',
        calories: 300,
        protein: 10,
        carbs: 45,
        fat: 5,
        mealDate: '2026-06-20',
      };

      const mockSavedMeal = {
        id: 'meal-uuid',
        userId,
        mealType: dto.mealType,
        title: dto.title,
        calories: dto.calories,
        protein: '10',
        carbs: '45',
        fat: '5',
        mealDate: dto.mealDate,
        createdAt: new Date(),
      };

      mockMealRepository.create.mockReturnValue(mockSavedMeal);
      mockMealRepository.save.mockResolvedValue(mockSavedMeal);

      const result = await service.create(userId, dto);

      expect(mockMealRepository.create).toHaveBeenCalledWith({
        userId,
        mealType: dto.mealType,
        title: dto.title,
        calories: dto.calories,
        protein: '10',
        carbs: '45',
        fat: '5',
        mealDate: dto.mealDate,
      });
      expect(mockMealRepository.save).toHaveBeenCalledWith(mockSavedMeal);
      expect(result).toEqual(mockSavedMeal);
    });

    it('should handle optional/null macronutrient fields', async () => {
      const userId = 'user-uuid';
      const dto: CreateMealDto = {
        mealType: 'Dinner',
        title: 'Salad',
        calories: 120,
      };

      const mockSavedMeal = {
        id: 'meal-uuid',
        userId,
        mealType: dto.mealType,
        title: dto.title,
        calories: dto.calories,
        protein: null,
        carbs: null,
        fat: null,
        mealDate: '2026-06-23',
      };

      mockMealRepository.create.mockReturnValue(mockSavedMeal);
      mockMealRepository.save.mockResolvedValue(mockSavedMeal);

      await service.create(userId, dto);

      expect(mockMealRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          protein: null,
          carbs: null,
          fat: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all meals for a user ordered by date', async () => {
      const userId = 'user-uuid';
      const mockMeals = [
        { id: '1', userId, mealDate: '2026-06-22' },
        { id: '2', userId, mealDate: '2026-06-21' },
      ];

      mockMealRepository.find.mockResolvedValue(mockMeals);

      const result = await service.findAll(userId);

      expect(mockMealRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { mealDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockMeals);
    });
  });

  describe('findOne', () => {
    it('should return a meal log if found', async () => {
      const userId = 'user-uuid';
      const mealId = 'meal-uuid';
      const mockMeal = { id: mealId, userId, title: 'Chicken Rice' };

      mockMealRepository.findOne.mockResolvedValue(mockMeal);

      const result = await service.findOne(userId, mealId);

      expect(mockMealRepository.findOne).toHaveBeenCalledWith({
        where: { id: mealId, userId },
      });
      expect(result).toEqual(mockMeal);
    });

    it('should throw NotFoundException if meal log not found', async () => {
      const userId = 'user-uuid';
      const mealId = 'invalid-uuid';

      mockMealRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, mealId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update fields', async () => {
      const userId = 'user-uuid';
      const mealId = 'meal-uuid';
      const existingMeal = {
        id: mealId,
        userId,
        title: 'Oats',
        calories: 250,
        protein: '5',
        carbs: '40',
        fat: '3',
        mealDate: '2026-06-20',
      };
      const dto: UpdateMealDto = {
        title: 'Blueberry Oats',
        calories: 300,
        protein: 7,
      };

      mockMealRepository.findOne.mockResolvedValue(existingMeal);
      mockMealRepository.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.update(userId, mealId, dto);

      expect(result.title).toBe('Blueberry Oats');
      expect(result.calories).toBe(300);
      expect(result.protein).toBe('7');
      expect(result.carbs).toBe('40'); // unchanged
    });
  });

  describe('remove', () => {
    it('should remove a meal log', async () => {
      const userId = 'user-uuid';
      const mealId = 'meal-uuid';
      const mockMeal = { id: mealId, userId, title: 'Salad' };

      mockMealRepository.findOne.mockResolvedValue(mockMeal);
      mockMealRepository.remove.mockResolvedValue(mockMeal);

      const result = await service.remove(userId, mealId);

      expect(mockMealRepository.remove).toHaveBeenCalledWith(mockMeal);
      expect(result).toEqual({ message: 'Meal log deleted successfully' });
    });
  });
});
