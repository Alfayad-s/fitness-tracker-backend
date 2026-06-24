import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateWorkoutLogDto {
  @IsUUID()
  workoutId: string;

  @IsOptional()
  @IsDateString()
  workoutDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  caloriesBurned?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
