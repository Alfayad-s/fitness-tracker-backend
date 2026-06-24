import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/schemas/user.entity';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';
import { WeightLogsService } from './weight-logs.service';

@Controller('weight-logs')
@UseGuards(JwtAuthGuard)
export class WeightLogsController {
  constructor(private readonly weightLogsService: WeightLogsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWeightLogDto) {
    return this.weightLogsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.weightLogsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.weightLogsService.findOne(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.weightLogsService.remove(user.id, id);
  }
}
