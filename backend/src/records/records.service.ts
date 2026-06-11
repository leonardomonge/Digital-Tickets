import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateRecordDto } from './dto/create-record.dto';

@Injectable()
export class RecordsService {
  constructor(
    private prisma: PrismaService,
    private scheduleService: ScheduleService,
  ) {}

  async scan(createRecordDto: CreateRecordDto) {
    const { cedula } = createRecordDto;

    // Detectar tipo de comida por hora
    const mealType = await this.scheduleService.getCurrentMealType();
    if (!mealType) {
      throw new BadRequestException('Fuera del horario de desayuno y almuerzo');
    }

    // Buscar empleado
    const employee = await this.prisma.employee.findUnique({
      where: { cedula },
      include: { category: true },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    if (!employee.active) throw new BadRequestException('Empleado inactivo');

    // Verificar doble escaneo en menos de 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentRecord = await this.prisma.record.findFirst({
      where: {
        employeeId: employee.id,
        mealType,
        createdAt: { gte: thirtyMinutesAgo },
      },
    });
    if (recentRecord) {
      throw new BadRequestException(
        `${employee.name} ya registró ${mealType === 'DESAYUNO' ? 'desayuno' : 'almuerzo'} recientemente`,
      );
    }

    // Determinar monto según categoría y tipo de comida
    const amount =
      mealType === 'DESAYUNO'
        ? employee.category.breakfastCost
        : employee.category.lunchCost;

    // Registrar la compra
    const record = await this.prisma.record.create({
      data: {
        employeeId: employee.id,
        mealType,
        amount,
      },
      include: {
        employee: {
          include: { category: true },
        },
      },
    });

    return {
      success: true,
      message: `${mealType === 'DESAYUNO' ? 'Desayuno' : 'Almuerzo'} registrado correctamente`,
      employee: employee.name,
      mealType,
      amount,
      time: record.createdAt,
    };
  }

  async getDashboard() {
    const now = new Date();
  
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
  
    const [
      dailyBreakfast, dailyLunch,
      weeklyBreakfast, weeklyLunch,
    ] = await Promise.all([
      this.prisma.record.aggregate({
        where: { createdAt: { gte: startOfDay }, mealType: 'DESAYUNO' },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.record.aggregate({
        where: { createdAt: { gte: startOfDay }, mealType: 'ALMUERZO' },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.record.aggregate({
        where: { createdAt: { gte: startOfWeek }, mealType: 'DESAYUNO' },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.record.aggregate({
        where: { createdAt: { gte: startOfWeek }, mealType: 'ALMUERZO' },
        _count: true,
        _sum: { amount: true },
      }),
    ]);
  
    return {
      daily: {
        breakfast: { count: dailyBreakfast._count, amount: dailyBreakfast._sum.amount ?? 0 },
        lunch: { count: dailyLunch._count, amount: dailyLunch._sum.amount ?? 0 },
      },
      weekly: {
        breakfast: { count: weeklyBreakfast._count, amount: weeklyBreakfast._sum.amount ?? 0 },
        lunch: { count: weeklyLunch._count, amount: weeklyLunch._sum.amount ?? 0 },
      },
    };
  }
   
    
    

  async getWeeklyReport() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setSeconds(-1);
    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
    startOfLastWeek.setHours(0, 0, 0, 0);

    return this.getReportByDateRange(startOfLastWeek, endOfLastWeek, 'SEMANAL');
  }

  async getBiweeklyReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.getReportByDateRange(start, end, 'QUINCENAL');
  }

  private async getReportByDateRange(start: Date, end: Date, payrollType: string) {
    const employees = await this.prisma.employee.findMany({
      where: { active: true, payrollType: payrollType as any },
      include: {
        category: true,
        records: {
          where: { createdAt: { gte: start, lte: end } },
        },
      },
    });

    return employees.map((employee) => {
      const breakfastCount = employee.records.filter(
        (r) => r.mealType === 'DESAYUNO',
      ).length;
      const lunchCount = employee.records.filter(
        (r) => r.mealType === 'ALMUERZO',
      ).length;
      const total = employee.records.reduce((sum, r) => sum + r.amount, 0);

      return {
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        category: employee.category.name,
        payrollType: employee.payrollType,
        breakfastCount,
        lunchCount,
        total,
      };
    });
  }

  async getEmployeeHistory(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');

    return this.prisma.record.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}