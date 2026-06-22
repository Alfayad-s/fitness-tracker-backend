import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { MeController } from './me.controller';
import { ProfileImageController } from './profile-image.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule, StorageModule, TypeOrmModule.forFeature([User])],
  controllers: [MeController, ProfileImageController],
  providers: [ProfileService],
})
export class ProfileModule {}
