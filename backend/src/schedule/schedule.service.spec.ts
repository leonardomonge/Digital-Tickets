import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';

// ─────────────────────────────────────────────
// FACTORY — horario de prueba reutilizable
// ─────────────────────────────────────────────
const makeSchedule = (overrides = {}) => ({
  id: 1,
  mealType: 'DESAYUNO' as const,
  startTime: '07:00',
  endTime: '10:00',
  ...overrides,
});

// Horarios típicos del sistema
const DEFAULT_SCHEDULES = [
  makeSchedule({ id: 1, mealType: 'DESAYUNO', startTime: '07:00', endTime: '10:00' }),
  makeSchedule({ id: 2, mealType: 'ALMUERZO', startTime: '11:30', endTime: '14:00' }),
];

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaMock: {
    schedule: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      schedule: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  // Restaurar el tiempo real después de cada test que lo mockee
  afterEach(() => {
    jest.useRealTimers();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // findAll()
  // ═══════════════════════════════════════════
  describe('findAll()', () => {
    it('retorna todos los horarios', async () => {
      prismaMock.schedule.findMany.mockResolvedValue(DEFAULT_SCHEDULES);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result).toEqual(DEFAULT_SCHEDULES);
    });

    it('retorna arreglo vacío si no hay horarios configurados', async () => {
      prismaMock.schedule.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════
  // update()
  // ═══════════════════════════════════════════
  describe('update()', () => {
    it('llama a upsert con los datos correctos', async () => {
      const dto = { mealType: 'DESAYUNO' as const, startTime: '08:00', endTime: '10:30' };
      const updatedSchedule = makeSchedule({ ...dto });
      prismaMock.schedule.upsert.mockResolvedValue(updatedSchedule);

      const result = await service.update(dto);

      // Verificamos que Prisma recibió exactamente lo que debe
      expect(prismaMock.schedule.upsert).toHaveBeenCalledWith({
        where: { mealType: 'DESAYUNO' },
        update: { startTime: '08:00', endTime: '10:30' },
        create: { mealType: 'DESAYUNO', startTime: '08:00', endTime: '10:30' },
      });

      expect(result).toEqual(updatedSchedule);
    });

    it('puede actualizar el horario de ALMUERZO', async () => {
      const dto = { mealType: 'ALMUERZO' as const, startTime: '12:00', endTime: '14:30' };
      prismaMock.schedule.upsert.mockResolvedValue(makeSchedule({ ...dto }));

      await service.update(dto);

      expect(prismaMock.schedule.upsert).toHaveBeenCalledWith({
        where: { mealType: 'ALMUERZO' },
        update: { startTime: '12:00', endTime: '14:30' },
        create: { mealType: 'ALMUERZO', startTime: '12:00', endTime: '14:30' },
      });
    });
  });

  // ═══════════════════════════════════════════
  // getCurrentMealType()
  // La parte más interesante: depende de la hora actual.
  // Usamos jest.useFakeTimers() para controlar el reloj.
  // ═══════════════════════════════════════════
  describe('getCurrentMealType()', () => {

    // Función helper: fija la hora del sistema a una hora específica
    const setFakeTime = (hours: number, minutes: number) => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2025, 0, 1, hours, minutes, 0));
    };

    beforeEach(() => {
      // Estos tests siempre usan los horarios por defecto
      prismaMock.schedule.findMany.mockResolvedValue(DEFAULT_SCHEDULES);
    });

    // ── Horario de DESAYUNO (07:00 - 10:00) ──
    describe('horario de desayuno', () => {
      it('retorna DESAYUNO a las 07:00 (inicio exacto)', async () => {
        setFakeTime(7, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBe('DESAYUNO');
      });

      it('retorna DESAYUNO a las 08:30 (mitad del horario)', async () => {
        setFakeTime(8, 30);
        const result = await service.getCurrentMealType();
        expect(result).toBe('DESAYUNO');
      });

      it('retorna DESAYUNO a las 10:00 (fin exacto)', async () => {
        setFakeTime(10, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBe('DESAYUNO');
      });
    });

    // ── Horario de ALMUERZO (11:30 - 14:00) ──
    describe('horario de almuerzo', () => {
      it('retorna ALMUERZO a las 11:30 (inicio exacto)', async () => {
        setFakeTime(11, 30);
        const result = await service.getCurrentMealType();
        expect(result).toBe('ALMUERZO');
      });

      it('retorna ALMUERZO a las 13:00 (mitad del horario)', async () => {
        setFakeTime(13, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBe('ALMUERZO');
      });

      it('retorna ALMUERZO a las 14:00 (fin exacto)', async () => {
        setFakeTime(14, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBe('ALMUERZO');
      });
    });

    // ── Fuera de horario ──────────────────────
    describe('fuera de horario', () => {
      it('retorna null a las 06:59 (antes del desayuno)', async () => {
        setFakeTime(6, 59);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });

      it('retorna null a las 10:01 (después del desayuno, antes del almuerzo)', async () => {
        setFakeTime(10, 1);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });

      it('retorna null a las 11:29 (justo antes del almuerzo)', async () => {
        setFakeTime(11, 29);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });

      it('retorna null a las 14:01 (después del almuerzo)', async () => {
        setFakeTime(14, 1);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });

      it('retorna null a las 20:00 (noche)', async () => {
        setFakeTime(20, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });
    });

    // ── Horarios configurables ────────────────
    // Esta es la regla de negocio clave: los horarios son dinámicos,
    // no hardcodeados. Si el admin los cambia, el sistema se adapta.
    describe('horarios configurables desde el panel', () => {
      it('respeta horarios personalizados si el admin los cambia', async () => {
        // Admin cambió el desayuno a 06:00 - 09:00
        prismaMock.schedule.findMany.mockResolvedValue([
          makeSchedule({ mealType: 'DESAYUNO', startTime: '06:00', endTime: '09:00' }),
          makeSchedule({ mealType: 'ALMUERZO', startTime: '12:00', endTime: '15:00' }),
        ]);

        setFakeTime(6, 30); // 06:30 → dentro del nuevo horario de desayuno
        const result = await service.getCurrentMealType();
        expect(result).toBe('DESAYUNO');
      });

      it('retorna null en horario que antes era válido pero el admin cambió', async () => {
        // El desayuno original era 07:00-10:00, admin lo cambió a 08:00-10:00
        prismaMock.schedule.findMany.mockResolvedValue([
          makeSchedule({ mealType: 'DESAYUNO', startTime: '08:00', endTime: '10:00' }),
        ]);

        setFakeTime(7, 30); // 07:30 → ya no está dentro del horario
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });

      it('retorna null si no hay horarios configurados en BD', async () => {
        prismaMock.schedule.findMany.mockResolvedValue([]);

        setFakeTime(8, 0);
        const result = await service.getCurrentMealType();
        expect(result).toBeNull();
      });
    });
  });
});