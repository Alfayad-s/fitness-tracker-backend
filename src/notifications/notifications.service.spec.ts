import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<Notification>;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a notification', async () => {
      const userId = 'user-uuid';
      const title = 'Workout Completed';
      const message = 'You finished your first workout!';
      const type = 'SYSTEM';

      const mockSavedNotification = {
        id: 'notif-uuid',
        userId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(mockSavedNotification);
      mockNotificationRepository.save.mockResolvedValue(mockSavedNotification);

      const result = await service.create(userId, title, message, type);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId,
        title,
        message,
        type,
        isRead: false,
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(mockSavedNotification);
      expect(result).toEqual(mockSavedNotification);
    });

    it('should handle optional message and type parameters as null', async () => {
      const userId = 'user-uuid';
      const title = 'Simple Alert';

      mockNotificationRepository.create.mockReturnValue({ title, message: null, type: null });
      mockNotificationRepository.save.mockResolvedValue({ title, message: null, type: null });

      await service.create(userId, title);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId,
        title,
        message: null,
        type: null,
        isRead: false,
      });
    });
  });

  describe('findAll', () => {
    it('should return all notifications for a user ordered by createdAt descending', async () => {
      const userId = 'user-uuid';
      const mockNotifications = [
        { id: '1', userId, title: 'Notif 1' },
        { id: '2', userId, title: 'Notif 2' },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.findAll(userId);

      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('findOne', () => {
    it('should return a notification if found', async () => {
      const userId = 'user-uuid';
      const notifId = 'notif-uuid';
      const mockNotif = { id: notifId, userId, title: 'Notif' };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotif);

      const result = await service.findOne(userId, notifId);

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notifId, userId },
      });
      expect(result).toEqual(mockNotif);
    });

    it('should throw NotFoundException if notification not found', async () => {
      const userId = 'user-uuid';
      const notifId = 'invalid-uuid';

      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, notifId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should set isRead to true and save', async () => {
      const userId = 'user-uuid';
      const notifId = 'notif-uuid';
      const existingNotif = { id: notifId, userId, title: 'Notif', isRead: false };

      mockNotificationRepository.findOne.mockResolvedValue(existingNotif);
      mockNotificationRepository.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.markAsRead(userId, notifId);

      expect(result.isRead).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(existingNotif);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread user notifications as read', async () => {
      const userId = 'user-uuid';
      const unreadList = [
        { id: '1', userId, isRead: false },
        { id: '2', userId, isRead: false },
      ];

      mockNotificationRepository.find.mockResolvedValue(unreadList);
      mockNotificationRepository.save.mockResolvedValue(unreadList);

      const result = await service.markAllAsRead(userId);

      expect(unreadList[0].isRead).toBe(true);
      expect(unreadList[1].isRead).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(unreadList);
      expect(result).toEqual({
        message: 'All notifications marked as read',
        count: 2,
      });
    });

    it('should return count 0 if no unread notifications exist', async () => {
      const userId = 'user-uuid';
      mockNotificationRepository.find.mockResolvedValue([]);

      const result = await service.markAllAsRead(userId);

      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
      expect(result.count).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove a notification', async () => {
      const userId = 'user-uuid';
      const notifId = 'notif-uuid';
      const mockNotif = { id: notifId, userId, title: 'Notif' };

      mockNotificationRepository.findOne.mockResolvedValue(mockNotif);
      mockNotificationRepository.remove.mockResolvedValue(mockNotif);

      const result = await service.remove(userId, notifId);

      expect(mockNotificationRepository.remove).toHaveBeenCalledWith(mockNotif);
      expect(result).toEqual({ message: 'Notification deleted successfully' });
    });
  });
});
