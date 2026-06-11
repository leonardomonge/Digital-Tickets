import { IsEnum, IsString, Matches } from 'class-validator';
import { MealType } from '@prisma/client';

export class UpdateScheduleDto {
  @IsEnum(MealType)
  mealType: MealType;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato de hora debe ser HH:MM',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato de hora debe ser HH:MM',
  })
  endTime: string;
}