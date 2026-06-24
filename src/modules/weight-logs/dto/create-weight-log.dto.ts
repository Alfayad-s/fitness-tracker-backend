import { IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateWeightLogDto {
  @IsNumber()
  @Min(20)
  @Max(500)
  weight: number;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
