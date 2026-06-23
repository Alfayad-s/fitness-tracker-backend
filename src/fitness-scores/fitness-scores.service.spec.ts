import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FitnessScoresService } from './fitness-scores.service';
import { FitnessScore } from '../entities/fitness-score.entity';
import { WorkoutLog } from '../entities/workout-log.entity';
import { WaterLog } from '../entities/water-log.entity';
import { Meal } from '../entities/meal.entity';
import { AchievementsService } from '../achievements/achievements.service';

describe('FitnessScoresService', () => {
  let service: FitnessScoresService;

  const mockFitnessScoreRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockWorkoutLogRepository = {
    find: jest.fn(),
  };

  const mockWaterLogRepository = {
    find: jest.fn(),
  };

  const mockMealRepository = {
    find: jest.fn(),
  };

  const mockAchievementsService = {
    calculateStreak: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FitnessScoresService,
        {
          provide: getRepositoryToken(FitnessScore),
          useValue: mockFitnessScoreRepository,
        },
        {
          provide: getRepositoryToken(WorkoutLog),
          useValue: mockWorkoutLogRepository,
        },
        {
          provide: getRepositoryToken(WaterLog),
          useValue: mockWaterLogRepository,
        },
        {
          provide: getRepositoryToken(Meal),
          useValue: mockMealRepository,
        },
        {
          provide: AchievementsService,
          useValue: mockAchievementsService,
        },
      ],
    }).compile();

    service = module.get<FitnessScoresService>(FitnessScoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAndSaveScore', () => {
    it('should compute a perfect score (100) when all categories are maxed out', async () => {
      const userId = 'user-uuid';

      // 1. Workouts: 4 unique days
      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: '2026-06-20' },
        { workoutDate: '2026-06-21' },
        { workoutDate: '2026-06-22' },
        { workoutDate: '2026-06-23' },
      ]);

      // 2. Streak: 7 days
      mockAchievementsService.calculateStreak.mockResolvedValue({ currentStreak: 7 });

      // 3. Water: Average >= 2000 ml (e.g. 14,000 ml total / 7)
      mockWaterLogRepository.find.mockResolvedValue([
        { amountMl: 7000 },
        { amountMl: 7000 },
      ]);

      // 4. Meals: Logged on 7 unique days
      mockMealRepository.find.mockResolvedValue([
        { mealDate: '2026-06-17' },
        { mealDate: '2026-06-18' },
        { mealDate: '2026-06-19' },
        { mealDate: '2026-06-20' },
        { mealDate: '2026-06-21' },
        { mealDate: '2026-06-22' },
        { mealDate: '2026-06-23' },
      ]);

      mockFitnessScoreRepository.create.mockImplementation((dto) => dto);
      mockFitnessScoreRepository.save.mockImplementation((x) => Promise.resolve({ id: 'score-uuid', ...x }));

      const result = await service.calculateAndSaveScore(userId);

      expect(result.score).toBe(100);
      expect(mockFitnessScoreRepository.create).toHaveBeenCalledWith({
        userId,
        score: 100,
      });
    });

    it('should calculate partial scores correctly', async () => {
      const userId = 'user-uuid';

      // 1. Workouts: 2 unique days (20 points)
      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: '2026-06-22' },
        { workoutDate: '2026-06-23' },
      ]);

      // 2. Streak: 3 days (10 points)
      mockAchievementsService.calculateStreak.mockResolvedValue({ currentStreak: 3 });

      // 3. Water: Average 1000 ml (7,000 ml total / 7) (10 points)
      mockWaterLogRepository.find.mockResolvedValue([
        { amountMl: 4000 },
        { amountMl: 3000 },
      ]);

      // 4. Meals: Logged on 4 unique days (10 points)
      mockMealRepository.find.mockResolvedValue([
        { mealDate: '2026-06-20' },
        { mealDate: '2026-06-21' },
        { mealDate: '2026-06-22' },
        { mealDate: '2026-06-23' },
      ]);

      mockFitnessScoreRepository.create.mockImplementation((dto) => dto);
      mockFitnessScoreRepository.save.mockImplementation((x) => Promise.resolve({ id: 'score-uuid', ...x }));

      const result = await service.calculateAndSaveScore(userId);

      expect(result.score).toBe(50); // 20 + 10 + 10 + 10 = 50
    });

    it('should compute 0 score if no logs are present', async () => {
      const userId = 'user-uuid';
      mockWorkoutLogRepository.find.mockResolvedValue([]);
      mockAchievementsService.calculateStreak.mockResolvedValue({ currentStreak: 0 });
      mockWaterLogRepository.find.mockResolvedValue([]);
      mockMealRepository.find.mockResolvedValue([]);

      mockFitnessScoreRepository.create.mockImplementation((dto) => dto);
      mockFitnessScoreRepository.save.mockImplementation((x) => Promise.resolve({ id: 'score-uuid', ...x }));

      const result = await service.calculateAndSaveScore(userId);

      expect(result.score).toBe(0);
    });
  });

  describe('getLatestScore', () => {
    it('should return the latest score record', async () => {
      const userId = 'user-uuid';
      const mockRecord = { id: 'score-1', score: 85 };
      mockFitnessScoreRepository.findOne.mockResolvedValue(mockRecord);

      const result = await service.getLatestScore(userId);

      expect(mockFitnessScoreRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        order: { calculatedAt: 'DESC' },
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getScoreHistory', () => {
    it('should return score calculations descending', async () => {
      const userId = 'user-uuid';
      const mockRecords = [{ id: '1', score: 85 }, { id: '2', score: 70 }];
      mockFitnessScoreRepository.find.mockResolvedValue(mockRecords);

      const result = await service.getScoreHistory(userId);

      expect(mockFitnessScoreRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { calculatedAt: 'DESC' },
      });
      expect(result).toEqual(mockRecords);
    });
  });
});
