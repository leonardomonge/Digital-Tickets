import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const existingCedula = await this.prisma.employee.findUnique({
      where: { cedula: createEmployeeDto.cedula },
    });
    if (existingCedula) throw new ConflictException('La cédula ya está registrada');

    const existingCode = await this.prisma.employee.findUnique({
      where: { employeeCode: createEmployeeDto.employeeCode },
    });
    if (existingCode) throw new ConflictException('El código de empleado ya está registrado');

    return this.prisma.employee.create({
      data: {
        ...createEmployeeDto,
        categoryId: Number(createEmployeeDto.categoryId),
      },
      include: { category: true },
    });
  }

  async findAll() {
    return this.prisma.employee.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        category: true,
        records: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async findByCedula(cedula: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { cedula },
      include: { category: true },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');

    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: { category: true },
    });
  }

  async remove(id: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');

    await this.prisma.employee.delete({ where: { id } });
    return { message: 'Empleado eliminado correctamente' };
  }
}
