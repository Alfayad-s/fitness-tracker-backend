import { IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { GoalType, GoalStatus } from '../../../common/enums/goals.enums';

export class CreateGoalDto {
  @IsEnum(GoalType)
  goalType: GoalType;

  @IsNumber()
  targetValue: number;

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
