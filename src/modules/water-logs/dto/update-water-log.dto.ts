import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateWaterLogDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amountMl?: number;

  @IsOptional()
  @IsDateString()
  loggedAt?: string;
}
