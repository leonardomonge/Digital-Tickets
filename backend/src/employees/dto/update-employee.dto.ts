import { IsString, IsEnum, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { PayrollType } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(PayrollType)
  payrollType?: PayrollType;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}