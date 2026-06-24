import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { User } from '../../../database/schemas/user.entity';
import { AiChatService } from './ai-chat.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('ask')
  ask(@CurrentUser() user: User, @Body() dto: AskQuestionDto) {
    return this.aiChatService.ask(user.id, dto);
  }

  @Get('history')
  getHistory(@CurrentUser() user: User) {
    return this.aiChatService.getHistory(user.id);
  }
}
