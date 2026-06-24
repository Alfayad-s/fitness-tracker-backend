import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatHistory } from '../../../database/schemas/ai-chat-history.entity';
import { User } from '../../../database/schemas/user.entity';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiChatHistory, User])],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class AiChatModule {}
