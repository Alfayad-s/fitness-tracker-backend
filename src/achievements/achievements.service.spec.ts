import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementsService } from './achievements.service';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { WorkoutLog } from '../entities/workout-log.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('AchievementsService', () => {
  let service: AchievementsService;

  const mockAchievementRepository = {
    find: jest.fn(),
  };

  const mockUserAchievementRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockWorkoutLogRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: mockAchievementRepository,
        },
        {
          provide: getRepositoryToken(UserAchievement),
          useValue: mockUserAchievementRepository,
        },
        {
          provide: getRepositoryToken(WorkoutLog),
          useValue: mockWorkoutLogRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateStreak', () => {
    it('should return 0 streak for user with no workouts', async () => {
      mockWorkoutLogRepository.find.mockResolvedValue([]);
      const result = await service.calculateStreak('user-uuid');
      expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
    });

    it('should calculate active streaks including today correctly', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: twoDaysAgoStr },
        { workoutDate: yesterdayStr },
        { workoutDate: todayStr },
      ]);

      const result = await service.calculateStreak('user-uuid');
      expect(result).toEqual({ currentStreak: 3, longestStreak: 3 });
    });

    it('should calculate active streak ending yesterday correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: twoDaysAgoStr },
        { workoutDate: yesterdayStr },
      ]);

      const result = await service.calculateStreak('user-uuid');
      expect(result).toEqual({ currentStreak: 2, longestStreak: 2 });
    });

    it('should calculate longest streak and broken current streak correctly', async () => {
      // Worked out 5 days ago and 4 days ago (streak of 2)
      // No workout since then
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const fourDaysAgoStr = fourDaysAgo.toISOString().split('T')[0];

      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: fiveDaysAgoStr },
        { workoutDate: fourDaysAgoStr },
      ]);

      const result = await service.calculateStreak('user-uuid');
      expect(result).toEqual({ currentStreak: 0, longestStreak: 2 });
    });
  });

  describe('checkAndAwardAchievements', () => {
    const mockAchievements = [
      { id: 'a0000000-0000-0000-0000-000000000001', title: 'First Steps', description: 'Log your first workout.' },
      { id: 'a0000000-0000-0000-0000-000000000002', title: 'Consistency Champion', description: 'Reach a 3-day workout streak.' },
      { id: 'a0000000-0000-0000-0000-000000000005', title: 'Early Bird', description: 'Log a workout before 8:00 AM.' },
    ];

    it('should award "First Steps" when first workout is logged', async () => {
      mockUserAchievementRepository.find.mockResolvedValue([]);
      mockAchievementRepository.find.mockResolvedValue(mockAchievements);
      mockWorkoutLogRepository.count.mockResolvedValue(1);
      
      // Empty workouts for streak calculation
      mockWorkoutLogRepository.find.mockResolvedValue([{ workoutDate: '2026-06-23', createdAt: new Date('2026-06-23T10:00:00Z') }]);

      mockUserAchievementRepository.create.mockImplementation((dto) => dto);
      mockUserAchievementRepository.save.mockImplementation((x) => Promise.resolve({ id: 'ua-1', ...x }));
      mockNotificationsService.create.mockResolvedValue(null);

      const result = await service.checkAndAwardAchievements('user-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].achievementId).toBe('a0000000-0000-0000-0000-000000000001');
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-uuid',
        'Achievement Unlocked: First Steps!',
        'Log your first workout.',
        'ACHIEVEMENT',
      );
    });

    it('should award "Early Bird" if workout was logged before 8 AM', async () => {
      mockUserAchievementRepository.find.mockResolvedValue([]);
      mockAchievementRepository.find.mockResolvedValue(mockAchievements);
      mockWorkoutLogRepository.count.mockResolvedValue(1);

      const earlyDate = new Date();
      earlyDate.setHours(7, 0, 0); // 7:00 AM

      mockWorkoutLogRepository.find.mockResolvedValue([
        { workoutDate: '2026-06-23', createdAt: earlyDate },
      ]);

      mockUserAchievementRepository.create.mockImplementation((dto) => dto);
      mockUserAchievementRepository.save.mockImplementation((x) => Promise.resolve({ id: 'ua-2', ...x }));

      const result = await service.checkAndAwardAchievements('user-uuid');

      // Should unlock "First Steps" and "Early Bird"
      expect(result.some(r => r.achievementId === 'a0000000-0000-0000-0000-000000000005')).toBe(true);
    });

    it('should not award achievements that are already earned', async () => {
      // User has already earned "First Steps"
      mockUserAchievementRepository.find.mockResolvedValue([
        { achievementId: 'a0000000-0000-0000-0000-000000000001' },
      ]);
      mockAchievementRepository.find.mockResolvedValue(mockAchievements);
      mockWorkoutLogRepository.count.mockResolvedValue(1);
      mockWorkoutLogRepository.find.mockResolvedValue([{ workoutDate: '2026-06-23', createdAt: new Date('2026-06-23T10:00:00Z') }]);

      const result = await service.checkAndAwardAchievements('user-uuid');

      expect(result).toHaveLength(0); // None newly awarded
    });
  });
});
