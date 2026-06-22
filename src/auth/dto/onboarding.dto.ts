import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class OnboardingDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsInt()
  @Min(13)
  @Max(120)
  age: number;

  @IsNumber()
  @Min(50)
  @Max(300)
  height: number;

  @IsNumber()
  @Min(20)
  @Max(500)
  currentWeight: number;

  @IsString()
  @IsNotEmpty()
  fitnessGoal: string;

  @IsString()
  @MinLength(8)
  password: string;
}
