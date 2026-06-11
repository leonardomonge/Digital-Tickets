import { IsString, IsEnum, IsInt } from 'class-validator';
import { PayrollType } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  employeeCode: string;

  @IsString()
  name: string;

  @IsString()
  cedula: string;

  @IsString()
  department: string;

  @IsEnum(PayrollType)
  payrollType: PayrollType;

  @IsInt()
  categoryId: number;
}