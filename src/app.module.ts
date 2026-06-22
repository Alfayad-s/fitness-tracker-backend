import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ProfileModule } from './profile/profile.module';
import { RedisModule } from './redis/redis.module';
import { GoalsModule } from './goals/goals.module';
import { WeightLogsModule } from './weight-logs/weight-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, authConfig, mailConfig, storageConfig],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    ProfileModule,
    GoalsModule,
    WeightLogsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
