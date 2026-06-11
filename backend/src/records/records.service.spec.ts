/**
 UNIT TESTS — RecordsService
 Digital Tickets · NestJS + Jest
.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service'


const makeCategory = (overrides = {}) => ({
  id: 1,
  name: 'Operativo',
  breakfastCost: 500,
  lunchCost: 1500,
  ...overrides,
});

const makeEmployee = (overrides = {}) => ({
  id: 1,
  cedula: '123456789',
  name: 'Juan Pérez',
  employeeCode: 'EMP001',
  department: 'TI',
  active: true,
  payrollType: 'SEMANAL',
  categoryId: 1,
  category: makeCategory(),
  ...overrides,
});

const makeRecord = (overrides = {}) => ({
  id: 1,
  employeeId: 1,
  mealType: 'DESAYUNO',
  amount: 500,
  createdAt: new Date(),
  ...overrides,
});


describe('RecordsService', () => {
  let service: RecordsService;

  // Mocks tipados: Jest reemplaza cada método con una función espiable
  let prismaMock: {
    employee: { findUnique: jest.Mock; findMany: jest.Mock };
    record: { findFirst: jest.Mock; create: jest.Mock; findMany: jest.Mock; aggregate: jest.Mock };
  };
  let scheduleMock: { getCurrentMealType: jest.Mock };

  // beforeEach 
  beforeEach(async () => {
    prismaMock = {
      employee: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      record: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    scheduleMock = {
      getCurrentMealType: jest.fn(),
    };

    // NestJS Testing Module: crea el servicio inyectando los mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ScheduleService, useValue: scheduleMock },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  // Sanity check: siempre útil como primer test
  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });


  // scan() — Lógica más crítica del sistema
 
  describe('scan()', () => {

    // Casos de HORARIO 
    describe('validación de horario', () => {
      it('lanza BadRequestException si está fuera de horario', async () => {
        // Simulamos que no hay comida activa en este momento
        scheduleMock.getCurrentMealType.mockResolvedValue(null);

        // "rejects.toThrow" es la forma correcta de testear excepciones async
        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow(BadRequestException);

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow('Fuera del horario de desayuno y almuerzo');
      });
    });

    //  Casos de EMPLEADO 
    describe('validación de empleado', () => {
      beforeEach(() => {
        // Para estos tests el horario siempre está activo
        scheduleMock.getCurrentMealType.mockResolvedValue('DESAYUNO');
      });

      it('lanza NotFoundException si la cédula no existe', async () => {
        prismaMock.employee.findUnique.mockResolvedValue(null);

        await expect(service.scan({ cedula: '000000000' }))
          .rejects.toThrow(NotFoundException);

        await expect(service.scan({ cedula: '000000000' }))
          .rejects.toThrow('Empleado no encontrado');
      });

      it('lanza BadRequestException si el empleado está inactivo', async () => {
        prismaMock.employee.findUnique.mockResolvedValue(
          makeEmployee({ active: false }),
        );

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow(BadRequestException);

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow('Empleado inactivo');
      });
    });

    //  Caso de DOBLE ESCANEO 
    describe('detección de doble escaneo', () => {
      beforeEach(() => {
        scheduleMock.getCurrentMealType.mockResolvedValue('DESAYUNO');
        prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());
      });

      it('lanza BadRequestException si ya escaneó en los últimos 30 minutos', async () => {
        // Simulamos que ya existe un registro reciente
        prismaMock.record.findFirst.mockResolvedValue(makeRecord());

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow(BadRequestException);

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow('Juan Pérez ya registró desayuno recientemente');
      });

      it('el mensaje menciona "almuerzo" cuando el tipo es ALMUERZO', async () => {
        scheduleMock.getCurrentMealType.mockResolvedValue('ALMUERZO');
        prismaMock.record.findFirst.mockResolvedValue(
          makeRecord({ mealType: 'ALMUERZO' }),
        );

        await expect(service.scan({ cedula: '123456789' }))
          .rejects.toThrow('Juan Pérez ya registró almuerzo recientemente');
      });

      it('verifica la ventana de 30 minutos con los parámetros correctos a Prisma', async () => {
        prismaMock.record.findFirst.mockResolvedValue(null);
        prismaMock.record.create.mockResolvedValue(
          makeRecord({ employee: makeEmployee() }),
        );

        const beforeCall = Date.now();
        await service.scan({ cedula: '123456789' });
        const afterCall = Date.now();

        // Inspeccionamos QUÉ le pasamos a Prisma
        const whereClause = prismaMock.record.findFirst.mock.calls[0][0].where;

        expect(whereClause.employeeId).toBe(1);
        expect(whereClause.mealType).toBe('DESAYUNO');

        // La fecha de corte debe estar ~30 min en el pasado
        const cutoff: Date = whereClause.createdAt.gte;
        const diffMs = beforeCall - cutoff.getTime();
        expect(diffMs).toBeGreaterThanOrEqual(30 * 60 * 1000 - 100); // tolerancia 100ms
        expect(diffMs).toBeLessThanOrEqual(30 * 60 * 1000 + (afterCall - beforeCall));
      });
    });

    //  Casos de MONTO (regla de negocio central) 
    describe('cálculo de monto según categoría y tipo de comida', () => {
      beforeEach(() => {
        // Sin registro reciente - permite escanear
        prismaMock.record.findFirst.mockResolvedValue(null);
      });

      it('usa breakfastCost cuando el tipo de comida es DESAYUNO', async () => {
        scheduleMock.getCurrentMealType.mockResolvedValue('DESAYUNO');
        const employee = makeEmployee({ category: makeCategory({ breakfastCost: 750 }) });
        prismaMock.employee.findUnique.mockResolvedValue(employee);

        const createdRecord = makeRecord({
          mealType: 'DESAYUNO',
          amount: 750,
          employee,
        });
        prismaMock.record.create.mockResolvedValue(createdRecord);

        const result = await service.scan({ cedula: '123456789' });

        expect(result.amount).toBe(750);
        expect(result.mealType).toBe('DESAYUNO');

        // Verificamos que Prisma guardó el monto correcto
        const createData = prismaMock.record.create.mock.calls[0][0].data;
        expect(createData.amount).toBe(750);
      });

      it('usa lunchCost cuando el tipo de comida es ALMUERZO', async () => {
        scheduleMock.getCurrentMealType.mockResolvedValue('ALMUERZO');
        const employee = makeEmployee({ category: makeCategory({ lunchCost: 2000 }) });
        prismaMock.employee.findUnique.mockResolvedValue(employee);

        const createdRecord = makeRecord({
          mealType: 'ALMUERZO',
          amount: 2000,
          employee,
        });
        prismaMock.record.create.mockResolvedValue(createdRecord);

        const result = await service.scan({ cedula: '123456789' });

        expect(result.amount).toBe(2000);
        expect(result.mealType).toBe('ALMUERZO');

        const createData = prismaMock.record.create.mock.calls[0][0].data;
        expect(createData.amount).toBe(2000);
      });

      it('el monto se persiste en el momento del escaneo (snapshot histórico)', async () => {
        // Esta es la regla: aunque luego cambien los precios, el monto guardado
        // refleja el precio al momento del escaneo.
        scheduleMock.getCurrentMealType.mockResolvedValue('DESAYUNO');
        const employee = makeEmployee({ category: makeCategory({ breakfastCost: 1234 }) });
        prismaMock.employee.findUnique.mockResolvedValue(employee);
        prismaMock.record.create.mockResolvedValue(makeRecord({ amount: 1234, employee }));

        await service.scan({ cedula: '123456789' });

        const savedAmount = prismaMock.record.create.mock.calls[0][0].data.amount;
        expect(savedAmount).toBe(1234); // snapshot del precio actual
      });
    });

    // Flujo EXITOSO completo 
    describe('respuesta exitosa', () => {
      it('retorna el objeto correcto cuando todo está bien (DESAYUNO)', async () => {
        scheduleMock.getCurrentMealType.mockResolvedValue('DESAYUNO');
        const employee = makeEmployee();
        prismaMock.employee.findUnique.mockResolvedValue(employee);
        prismaMock.record.findFirst.mockResolvedValue(null);

        const recordCreated = makeRecord({ employee, createdAt: new Date('2025-01-01T08:00:00') });
        prismaMock.record.create.mockResolvedValue(recordCreated);

        const result = await service.scan({ cedula: '123456789' });

        expect(result).toMatchObject({
          success: true,
          message: 'Desayuno registrado correctamente',
          employee: 'Juan Pérez',
          mealType: 'DESAYUNO',
          amount: 500,
        });
        expect(result.time).toBeDefined();
      });

      it('retorna mensaje de "Almuerzo" cuando el tipo es ALMUERZO', async () => {
        scheduleMock.getCurrentMealType.mockResolvedValue('ALMUERZO');
        const employee = makeEmployee();
        prismaMock.employee.findUnique.mockResolvedValue(employee);
        prismaMock.record.findFirst.mockResolvedValue(null);
        prismaMock.record.create.mockResolvedValue(makeRecord({ mealType: 'ALMUERZO', amount: 1500, employee }));

        const result = await service.scan({ cedula: '123456789' });

        expect(result.message).toBe('Almuerzo registrado correctamente');
      });
    });
  });

  
  // getDashboard() — Agregados diarios y semanales
  
  describe('getDashboard()', () => {
    it('retorna estructura con daily y weekly correctamente', async () => {
      // Simulamos las 4 llamadas a aggregate que hace el servicio
      prismaMock.record.aggregate
        .mockResolvedValueOnce({ _count: 10, _sum: { amount: 5000 } })  // daily DESAYUNO
        .mockResolvedValueOnce({ _count: 8,  _sum: { amount: 12000 } }) // daily ALMUERZO
        .mockResolvedValueOnce({ _count: 45, _sum: { amount: 22500 } }) // weekly DESAYUNO
        .mockResolvedValueOnce({ _count: 40, _sum: { amount: 60000 } }); // weekly ALMUERZO

      const result = await service.getDashboard();

      expect(result.daily.breakfast).toEqual({ count: 10, amount: 5000 });
      expect(result.daily.lunch).toEqual({ count: 8, amount: 12000 });
      expect(result.weekly.breakfast).toEqual({ count: 45, amount: 22500 });
      expect(result.weekly.lunch).toEqual({ count: 40, amount: 60000 });
    });

    it('maneja amount null (sin registros) retornando 0', async () => {
      // Cuando no hay registros, Prisma retorna _sum.amount = null
      prismaMock.record.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { amount: null },
      });

      const result = await service.getDashboard();

      // El servicio hace "?? 0" — verificamos que funciona
      expect(result.daily.breakfast.amount).toBe(0);
      expect(result.daily.lunch.amount).toBe(0);
      expect(result.weekly.breakfast.amount).toBe(0);
      expect(result.weekly.lunch.amount).toBe(0);
    });
  });

  
  // getEmployeeHistory()
  
  describe('getEmployeeHistory()', () => {
    it('lanza NotFoundException si el empleado no existe', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.getEmployeeHistory(999))
        .rejects.toThrow(NotFoundException);

      await expect(service.getEmployeeHistory(999))
        .rejects.toThrow('Empleado no encontrado');
    });

    it('retorna los registros del empleado ordenados por fecha', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());

      const records = [
        makeRecord({ id: 2, createdAt: new Date('2025-01-02') }),
        makeRecord({ id: 1, createdAt: new Date('2025-01-01') }),
      ];
      prismaMock.record.findMany.mockResolvedValue(records);

      const result = await service.getEmployeeHistory(1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2); // más reciente primero

      // Verificamos que pedimos orden desc
      const orderBy = prismaMock.record.findMany.mock.calls[0][0].orderBy;
      expect(orderBy).toEqual({ createdAt: 'desc' });
    });

    it('retorna arreglo vacío si el empleado no tiene registros', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());
      prismaMock.record.findMany.mockResolvedValue([]);

      const result = await service.getEmployeeHistory(1);
      expect(result).toEqual([]);
    });
  });

  
  // getWeeklyReport() y getBiweeklyReport()
  
  describe('reportes', () => {
    const mockEmployees = [
      {
        ...makeEmployee({ id: 1, name: 'Juan Pérez', payrollType: 'SEMANAL' }),
        records: [
          makeRecord({ mealType: 'DESAYUNO', amount: 500 }),
          makeRecord({ mealType: 'DESAYUNO', amount: 500 }),
          makeRecord({ mealType: 'ALMUERZO', amount: 1500 }),
        ],
      },
      {
        ...makeEmployee({ id: 2, name: 'María López', payrollType: 'SEMANAL', cedula: '987654321' }),
        records: [],
      },
    ];

    it('getWeeklyReport() calcula correctamente breakfastCount, lunchCount y total', async () => {
      prismaMock.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await service.getWeeklyReport();

      expect(result[0].name).toBe('Juan Pérez');
      expect(result[0].breakfastCount).toBe(2);
      expect(result[0].lunchCount).toBe(1);
      expect(result[0].total).toBe(2500); // 500 + 500 + 1500
    });

    it('getWeeklyReport() incluye empleados con 0 registros en el reporte', async () => {
      prismaMock.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await service.getWeeklyReport();

      expect(result[1].name).toBe('María López');
      expect(result[1].breakfastCount).toBe(0);
      expect(result[1].lunchCount).toBe(0);
      expect(result[1].total).toBe(0);
    });

    it('getBiweeklyReport() ajusta endDate a las 23:59:59 del día seleccionado', async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      await service.getBiweeklyReport('2025-01-01', '2025-01-15');

      const call = prismaMock.employee.findMany.mock.calls[0][0];
      const endDate: Date = call.include.records.where.createdAt.lte;

      // La hora final debe ser 23:59:59 para incluir todo el día
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    it('getBiweeklyReport() filtra solo empleados QUINCENAL', async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);

      await service.getBiweeklyReport('2025-01-01', '2025-01-15');

      const where = prismaMock.employee.findMany.mock.calls[0][0].where;
      expect(where.payrollType).toBe('QUINCENAL');
    });

    it('getWeeklyReport() filtra solo empleados SEMANAL', async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);

      await service.getWeeklyReport();

      const where = prismaMock.employee.findMany.mock.calls[0][0].where;
      expect(where.payrollType).toBe('SEMANAL');
    });
  });
});