import { IsString, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  breakfastCost: number;

  @IsInt()
  @Min(0)
  lunchCost: number;
}