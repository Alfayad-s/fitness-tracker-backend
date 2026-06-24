import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../../database/schemas/user.entity';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { MeController } from './me.controller';
import { ProfileImageController } from './profile-image.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule, StorageModule, TypeOrmModule.forFeature([User])],
  controllers: [MeController, ProfileImageController],
  providers: [ProfileService],
})
export class ProfileModule {}
