import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAJERO', 'SUPER_ADMIN', 'ADMIN')
  scan(@Body() createRecordDto: CreateRecordDto) {
    return this.recordsService.scan(createRecordDto);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getDashboard() {
    return this.recordsService.getDashboard();
  }

  @Get('report/weekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getWeeklyReport() {
    return this.recordsService.getWeeklyReport();
  }

  @Get('report/biweekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getBiweeklyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.recordsService.getBiweeklyReport(startDate, endDate);
  }

  @Get('employee/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  getEmployeeHistory(@Param('id') id: string) {
    return this.recordsService.getEmployeeHistory(+id);
  }
}
