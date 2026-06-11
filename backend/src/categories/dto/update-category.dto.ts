import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakfastCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lunchCost?: number;
}