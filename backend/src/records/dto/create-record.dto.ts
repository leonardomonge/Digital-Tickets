import { IsString } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  cedula: string;
}