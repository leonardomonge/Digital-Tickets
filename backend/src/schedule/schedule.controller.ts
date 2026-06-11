import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrent() {
    return this.scheduleService.getCurrentMealType();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  findAll() {
    return this.scheduleService.findAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(updateScheduleDto);
  }
}