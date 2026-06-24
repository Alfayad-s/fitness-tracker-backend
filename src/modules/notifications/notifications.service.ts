import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/schemas/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    title: string,
    message?: string | null,
    type?: string | null,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message: message ?? null,
      type: type ?? null,
      isRead: false,
    });

    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.findOne(userId, id);
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ message: string; count: number }> {
    const unread = await this.notificationsRepository.find({
      where: { userId, isRead: false },
    });

    if (unread.length > 0) {
      unread.forEach((n) => (n.isRead = true));
      await this.notificationsRepository.save(unread);
    }

    return {
      message: 'All notifications marked as read',
      count: unread.length,
    };
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const notification = await this.findOne(userId, id);
    await this.notificationsRepository.remove(notification);
    return { message: 'Notification deleted successfully' };
  }
}
