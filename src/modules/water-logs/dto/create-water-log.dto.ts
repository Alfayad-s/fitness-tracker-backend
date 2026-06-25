import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateWaterLogDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  amountMl: number;

  @IsOptional()
  @IsDateString()
  loggedAt?: string;
}
