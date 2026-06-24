import { IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateNutritionDto {
  @IsOptional()
  @IsString()
  preferences?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];
}
