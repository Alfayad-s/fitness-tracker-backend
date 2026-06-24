import { IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { GoalStatus } from '../../../common/enums/goals.enums';

export class UpdateGoalDto {
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
