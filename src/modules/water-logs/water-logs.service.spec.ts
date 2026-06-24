import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterLogsService } from './water-logs.service';
import { WaterLog } from '../../database/schemas/water-log.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateWaterLogDto } from './dto/create-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';

describe('WaterLogsService', () => {
  let service: WaterLogsService;
  let repository: Repository<WaterLog>;

  const mockWaterLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaterLogsService,
        {
          provide: getRepositoryToken(WaterLog),
          useValue: mockWaterLogRepository,
        },
      ],
    }).compile();

    service = module.get<WaterLogsService>(WaterLogsService);
    repository = module.get<Repository<WaterLog>>(getRepositoryToken(WaterLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a water log', async () => {
      const userId = 'user-uuid';
      const dto: CreateWaterLogDto = {
        amountMl: 250,
        loggedAt: '2026-06-23T10:00:00.000Z',
      };

      const mockSavedLog = {
        id: 'log-uuid',
        userId,
        amountMl: dto.amountMl,
        loggedAt: new Date(dto.loggedAt),
      };

      mockWaterLogRepository.create.mockReturnValue(mockSavedLog);
      mockWaterLogRepository.save.mockResolvedValue(mockSavedLog);

      const result = await service.create(userId, dto);

      expect(mockWaterLogRepository.create).toHaveBeenCalledWith({
        userId,
        amountMl: dto.amountMl,
        loggedAt: new Date(dto.loggedAt),
      });
      expect(mockWaterLogRepository.save).toHaveBeenCalledWith(mockSavedLog);
      expect(result).toEqual(mockSavedLog);
    });

    it('should default loggedAt to current date/time if not specified', async () => {
      const userId = 'user-uuid';
      const dto: CreateWaterLogDto = {
        amountMl: 500,
      };

      const mockSavedLog = {
        id: 'log-uuid',
        userId,
        amountMl: dto.amountMl,
        loggedAt: new Date(),
      };

      mockWaterLogRepository.create.mockReturnValue(mockSavedLog);
      mockWaterLogRepository.save.mockResolvedValue(mockSavedLog);

      await service.create(userId, dto);

      expect(mockWaterLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amountMl: dto.amountMl,
          loggedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all water logs for a user ordered by loggedAt descending', async () => {
      const userId = 'user-uuid';
      const mockLogs = [
        { id: '1', userId, amountMl: 250, loggedAt: new Date('2026-06-23T12:00:00Z') },
        { id: '2', userId, amountMl: 500, loggedAt: new Date('2026-06-23T08:00:00Z') },
      ];

      mockWaterLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findAll(userId);

      expect(mockWaterLogRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { loggedAt: 'DESC' },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findOne', () => {
    it('should return a water log if found', async () => {
      const userId = 'user-uuid';
      const logId = 'log-uuid';
      const mockLog = { id: logId, userId, amountMl: 250 };

      mockWaterLogRepository.findOne.mockResolvedValue(mockLog);

      const result = await service.findOne(userId, logId);

      expect(mockWaterLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: logId, userId },
      });
      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if water log not found', async () => {
      const userId = 'user-uuid';
      const logId = 'invalid-uuid';

      mockWaterLogRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, logId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update water log fields', async () => {
      const userId = 'user-uuid';
      const logId = 'log-uuid';
      const existingLog = {
        id: logId,
        userId,
        amountMl: 250,
        loggedAt: new Date('2026-06-23T08:00:00Z'),
      };
      const dto: UpdateWaterLogDto = {
        amountMl: 350,
      };

      mockWaterLogRepository.findOne.mockResolvedValue(existingLog);
      mockWaterLogRepository.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.update(userId, logId, dto);

      expect(result.amountMl).toBe(350);
      expect(mockWaterLogRepository.save).toHaveBeenCalledWith(existingLog);
    });
  });

  describe('remove', () => {
    it('should remove a water log', async () => {
      const userId = 'user-uuid';
      const logId = 'log-uuid';
      const mockLog = { id: logId, userId, amountMl: 250 };

      mockWaterLogRepository.findOne.mockResolvedValue(mockLog);
      mockWaterLogRepository.remove.mockResolvedValue(mockLog);

      const result = await service.remove(userId, logId);

      expect(mockWaterLogRepository.remove).toHaveBeenCalledWith(mockLog);
      expect(result).toEqual({ message: 'Water log deleted successfully' });
    });
  });
});
