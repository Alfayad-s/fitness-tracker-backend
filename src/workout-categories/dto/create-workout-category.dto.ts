import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
