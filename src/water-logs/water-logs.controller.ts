import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { CreateWaterLogDto } from './dto/create-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';
import { WaterLogsService } from './water-logs.service';

@Controller('water-logs')
@UseGuards(JwtAuthGuard)
export class WaterLogsController {
  constructor(private readonly waterLogsService: WaterLogsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWaterLogDto) {
    return this.waterLogsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.waterLogsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.waterLogsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateWaterLogDto,
  ) {
    return this.waterLogsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.waterLogsService.remove(user.id, id);
  }
}
