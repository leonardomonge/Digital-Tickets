import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PayrollType } from '@prisma/client';

export class ReportDto {
  @IsEnum(PayrollType)
  payrollType: PayrollType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}