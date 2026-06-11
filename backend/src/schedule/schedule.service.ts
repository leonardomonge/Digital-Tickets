import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { MealType } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.schedule.findMany();
  }

  async update(updateScheduleDto: UpdateScheduleDto) {
    const { mealType, startTime, endTime } = updateScheduleDto;

    const schedule = await this.prisma.schedule.upsert({
      where: { mealType },
      update: { startTime, endTime },
      create: { mealType, startTime, endTime },
    });

    return schedule;
  }

  async getCurrentMealType(): Promise<MealType | null> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const schedules = await this.prisma.schedule.findMany();

    for (const schedule of schedules) {
      if (currentTime >= schedule.startTime && currentTime <= schedule.endTime) {
        return schedule.mealType;
      }
    }

    return null;
  }
}
