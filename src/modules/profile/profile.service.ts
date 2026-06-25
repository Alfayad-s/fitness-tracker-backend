import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenService } from '../auth/token.service';
import { User } from '../../database/schemas/user.entity';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly storageService: StorageService,
  ) {}

  getMe(user: User) {
    return this.tokenService.sanitizeUser(user);
  }

  async updateMe(user: User, dto: UpdateMeDto) {
    const updates: Partial<User> = {};

    if (dto.firstName !== undefined) updates.firstName = dto.firstName;
    if (dto.lastName !== undefined) updates.lastName = dto.lastName;
    if (dto.gender !== undefined) updates.gender = dto.gender;
    if (dto.age !== undefined) updates.age = dto.age;
    if (dto.height !== undefined) updates.height = dto.height.toString();
    if (dto.currentWeight !== undefined) {
      updates.currentWeight = dto.currentWeight.toString();
    }
    if (dto.targetWeight !== undefined) {
      updates.targetWeight = dto.targetWeight.toString();
    }
    if (dto.activityLevel !== undefined) {
      updates.activityLevel = dto.activityLevel;
    }
    if (dto.fitnessGoal !== undefined) updates.fitnessGoal = dto.fitnessGoal;

    await this.usersRepository.update(user.id, updates);

    const updatedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.tokenService.sanitizeUser(updatedUser);
  }

  async setProfileImage(user: User, file: Express.Multer.File) {
    const profileImageUrl = await this.storageService.uploadProfileImage(
      user.id,
      file,
    );

    await this.usersRepository.update(user.id, {
      profileImage: profileImageUrl,
    });

    const updatedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.tokenService.sanitizeUser(updatedUser);
  }
}
