import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiWorkoutService } from './ai-workout.service';
import { AiWorkoutPlan } from '../entities/ai-workout-plan.entity';
import { User } from '../entities/user.entity';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';
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

describe('AiWorkoutService', () => {
  let service: AiWorkoutService;

  const mockAiWorkoutPlanRepository = {
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
        AiWorkoutService,
        {
          provide: getRepositoryToken(AiWorkoutPlan),
          useValue: mockAiWorkoutPlanRepository,
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

    service = module.get<AiWorkoutService>(AiWorkoutService);
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
      title: 'Lose Weight Speed Run',
      goal: 'fat loss',
      difficulty: 'Intermediate',
      weeklyFrequency: 3,
      notes: 'Ensure proper warm up',
      days: [],
    };

    it('should generate a workout plan successfully', async () => {
      const dto: GenerateWorkoutDto = {
        goal: 'fat loss',
        preferences: 'dumbbell only',
        daysPerWeek: 3,
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
        goal: dto.goal,
        prompt: '...',
        generatedPlan: JSON.stringify(mockPlanJson),
        createdAt: new Date(),
      };

      mockAiWorkoutPlanRepository.create.mockReturnValue(mockSavedRecord);
      mockAiWorkoutPlanRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.generatePlan('user-uuid', dto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockAiWorkoutPlanRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid',
        goal: dto.goal,
      }));
      expect(result.generatedPlan).toEqual(mockPlanJson);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generatePlan('invalid-user', { goal: 'build muscle' }),
      ).rejects.toThrow(NotFoundException);
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
        service.generatePlan('user-uuid', { goal: 'build muscle' }),
      ).rejects.toThrow(InternalServerErrorException);

      mockFetch.mockRestore();
    });

    it('should fall back to Groq if Gemini call fails and save the plan', async () => {
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
        goal: 'fat loss',
        prompt: '... [Fallback to Groq]',
        generatedPlan: JSON.stringify(mockPlanJson),
        createdAt: new Date(),
      };

      mockAiWorkoutPlanRepository.create.mockReturnValue(mockSavedRecord);
      mockAiWorkoutPlanRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.generatePlan('user-uuid', { goal: 'fat loss' });

      expect(result.generatedPlan).toEqual(mockPlanJson);
      expect(mockFetch).toHaveBeenCalled();
      mockFetch.mockRestore();
    });
  });

  describe('getHistory', () => {
    it('should return parsed plan history', async () => {
      const mockHistory = [
        {
          id: '1',
          goal: 'build muscle',
          generatedPlan: JSON.stringify({ title: 'Plan 1' }),
        },
      ];
      mockAiWorkoutPlanRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory('user-uuid');

      expect(mockAiWorkoutPlanRepository.find).toHaveBeenCalledWith({
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
        goal: 'cardio',
        generatedPlan: JSON.stringify({ title: 'Cardio' }),
      };
      mockAiWorkoutPlanRepository.findOne.mockResolvedValue(mockRecord);

      const result = await service.findOne('user-uuid', 'plan-1');

      expect(mockAiWorkoutPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-1', userId: 'user-uuid' },
      });
      expect(result.generatedPlan).toEqual({ title: 'Cardio' });
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      mockAiWorkoutPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-uuid', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
