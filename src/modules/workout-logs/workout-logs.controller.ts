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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/schemas/user.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { WorkoutLogsService } from './workout-logs.service';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWorkoutLogDto) {
    return this.workoutLogsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.workoutLogsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.workoutLogsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutLogDto,
  ) {
    return this.workoutLogsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.workoutLogsService.remove(user.id, id);
  }
}
