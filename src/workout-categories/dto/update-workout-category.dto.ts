import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
