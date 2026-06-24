import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiNutritionService } from './ai-nutrition.service';
import { AiNutritionPlan } from '../../../database/schemas/ai-nutrition-plan.entity';
import { User } from '../../../database/schemas/user.entity';
import { GenerateNutritionDto } from './dto/generate-nutrition.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

// Mock the @google/generative-ai module
const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: mockGenerateContent,
          };
        }),
      };
    }),
  };
});

describe('AiNutritionService', () => {
  let service: AiNutritionService;

  const mockAiNutritionPlanRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'ai.geminiApiKey') return 'mock-gemini-key';
      if (key === 'ai.groqApiKeys') return 'gsk_key1,gsk_key2';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiNutritionService,
        {
          provide: getRepositoryToken(AiNutritionPlan),
          useValue: mockAiNutritionPlanRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiNutritionService>(AiNutritionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePlan', () => {
    const mockUser = {
      id: 'user-uuid',
      age: 28,
      gender: 'Male',
      height: '180.0',
      currentWeight: '80.0',
      targetWeight: '75.0',
      activityLevel: 'Active',
      fitnessGoal: 'Lose weight',
    };

    const mockPlanJson = {
      title: 'Vegetarian High-Protein Meal Plan',
      goal: 'fat loss',
      targetCalories: 2200,
      macrosTarget: { proteinGrams: 140, carbsGrams: 240, fatGrams: 75 },
      dietaryRestrictions: ['Vegetarian'],
      notes: 'Test notes',
      meals: [],
    };

    it('should generate a nutrition plan successfully using Gemini', async () => {
      const dto: GenerateNutritionDto = {
        preferences: 'high protein',
        dietaryRestrictions: ['Vegetarian'],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockPlanJson),
        },
      });

      const mockSavedRecord = {
        id: 'plan-uuid',
        userId: 'user-uuid',
        prompt: '...',
        generatedPlan: JSON.stringify(mockPlanJson),
        createdAt: new Date(),
      };

      mockAiNutritionPlanRepository.create.mockReturnValue(mockSavedRecord);
      mockAiNutritionPlanRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.generatePlan('user-uuid', dto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockAiNutritionPlanRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid',
      }));
      expect(result.generatedPlan).toEqual(mockPlanJson);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generatePlan('invalid-user', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fall back to Groq if Gemini fails', async () => {
      const dto: GenerateNutritionDto = {
        preferences: 'high protein',
        dietaryRestrictions: ['Vegetarian'],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockGenerateContent.mockRejectedValue(new Error('API quota limit exceeded'));

      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockPlanJson),
                  },
                },
              ],
            }),
        } as any),
      );

      const mockSavedRecord = {
        id: 'plan-uuid-groq',
        userId: 'user-uuid',
        prompt: '... [Fallback to Groq]',
        generatedPlan: JSON.stringify(mockPlanJson),
        createdAt: new Date(),
      };

      mockAiNutritionPlanRepository.create.mockReturnValue(mockSavedRecord);
      mockAiNutritionPlanRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.generatePlan('user-uuid', dto);

      expect(result.generatedPlan).toEqual(mockPlanJson);
      expect(mockFetch).toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should throw InternalServerErrorException if both Gemini and Groq calls fail', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockGenerateContent.mockRejectedValue(new Error('API quota limit exceeded'));

      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Groq rate limit'),
        } as any),
      );

      await expect(
        service.generatePlan('user-uuid', {}),
      ).rejects.toThrow(InternalServerErrorException);

      mockFetch.mockRestore();
    });
  });

  describe('getHistory', () => {
    it('should return parsed plan history', async () => {
      const mockHistory = [
        {
          id: '1',
          generatedPlan: JSON.stringify({ title: 'Plan 1' }),
        },
      ];
      mockAiNutritionPlanRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory('user-uuid');

      expect(mockAiNutritionPlanRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        order: { createdAt: 'DESC' },
      });
      expect(result[0].generatedPlan).toEqual({ title: 'Plan 1' });
    });
  });

  describe('findOne', () => {
    it('should return a single plan log', async () => {
      const mockRecord = {
        id: 'plan-1',
        generatedPlan: JSON.stringify({ title: 'Plan 1' }),
      };
      mockAiNutritionPlanRepository.findOne.mockResolvedValue(mockRecord);

      const result = await service.findOne('user-uuid', 'plan-1');

      expect(mockAiNutritionPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-1', userId: 'user-uuid' },
      });
      expect(result.generatedPlan).toEqual({ title: 'Plan 1' });
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      mockAiNutritionPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-uuid', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
