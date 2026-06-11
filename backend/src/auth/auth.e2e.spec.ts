/**
 * INTEGRATION TESTS — Auth Module
 * Digital Tickets · NestJS + Supertest
 *
 * A diferencia de los unit tests, aquí levantamos un módulo NestJS
 * real en memoria y hacemos peticiones HTTP reales con supertest.
 * Mockeamos solo la BD (Prisma) y nada más.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import  request from 'supertest';
import { AuthModule } from './auth.module';
import { PrismaModule } from '../prisma/prisma.module'; 
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

describe('Auth — Integration Tests (/auth)', () => {
  let app: INestApplication;
  let prismaMock: { user: { findUnique: jest.Mock } };

  // Hash real de 'admin123' para que bcrypt.compare funcione correctamente
  let hashedPassword: string;

  beforeAll(async () => {
    // Generamos el hash una sola vez para toda la suite (es lento)
    hashedPassword = await bcrypt.hash('admin123', 10);

    prismaMock = {
      user: { findUnique: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // ConfigModule con valores de prueba inline — sin depender de .env
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            JWT_SECRET: 'test-secret-key',
            JWT_EXPIRES_IN: '1h',
          })],
        }),
        PrismaModule.forRoot(), 
        AuthModule,
      ],
    })
      // Reemplazamos PrismaService con el mock en todo el módulo
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe igual que en main.ts — para que los DTOs validen correctamente
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════
  // POST /auth/login
  // ═══════════════════════════════════════════
  describe('POST /auth/login', () => {

    // ── Casos exitosos ────────────────────────
    describe('login exitoso', () => {
      it('retorna 201 con accessToken y datos del usuario', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 1,
          name: 'Admin Test',
          email: 'admin@digitaltickets.com',
          password: hashedPassword,
          role: 'ADMIN',
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com', password: 'admin123' })
          .expect(201);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user).toMatchObject({
          id: 1,
          name: 'Admin Test',
          email: 'admin@digitaltickets.com',
          role: 'ADMIN',
        });
      });

      it('el accessToken es un JWT válido (formato x.x.x)', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 1,
          name: 'Admin Test',
          email: 'admin@digitaltickets.com',
          password: hashedPassword,
          role: 'ADMIN',
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com', password: 'admin123' })
          .expect(201);

        // Un JWT siempre tiene el formato: header.payload.signature
        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        expect(response.body.accessToken).toMatch(jwtRegex);
      });

      it('la respuesta no incluye el password del usuario', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 1,
          name: 'Admin Test',
          email: 'admin@digitaltickets.com',
          password: hashedPassword,
          role: 'ADMIN',
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com', password: 'admin123' })
          .expect(201);

        expect(response.body.user).not.toHaveProperty('password');
      });
    });

    // ── Credenciales incorrectas ──────────────
    describe('credenciales incorrectas', () => {
      it('retorna 401 si el email no existe', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'noexiste@test.com', password: 'admin123' })
          .expect(401);

        expect(response.body.message).toBe('Credenciales incorrectas');
      });

      it('retorna 401 si la contraseña es incorrecta', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: 1,
          name: 'Admin Test',
          email: 'admin@digitaltickets.com',
          password: hashedPassword,
          role: 'ADMIN',
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com', password: 'wrongpassword' })
          .expect(401);

        expect(response.body.message).toBe('Credenciales incorrectas');
      });

      it('ambos errores retornan el mismo mensaje (no revela cuál falló)', async () => {
        // Email inexistente
        prismaMock.user.findUnique.mockResolvedValue(null);
        const res1 = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'noexiste@test.com', password: 'admin123' });

        // Contraseña incorrecta
        prismaMock.user.findUnique.mockResolvedValue({
          id: 1,
          email: 'admin@digitaltickets.com',
          password: hashedPassword,
          role: 'ADMIN',
        });
        const res2 = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com', password: 'wrongpassword' });

        expect(res1.body.message).toBe(res2.body.message);
      });
    });

    // ── Validación del DTO ────────────────────
    // Estos tests verifican que el ValidationPipe rechaza
    // requests malformados antes de llegar al servicio.
    describe('validación del body', () => {
      it('retorna 400 si falta el email', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ password: 'admin123' })
          .expect(400);
      });

      it('retorna 400 si falta el password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@digitaltickets.com' })
          .expect(400);
      });

      it('retorna 400 si el body está vacío', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(400);
      });

      it('retorna 400 si el email no tiene formato válido', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'no-es-un-email', password: 'admin123' })
          .expect(400);
      });
    });
  });
});