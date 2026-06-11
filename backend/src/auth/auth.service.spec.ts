import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mockeamos bcryptjs completo — necesario porque el módulo
// define sus propiedades como no-escribibles (writable: false)
// lo que impide usar jest.spyOn directamente.
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Importamos DESPUÉS del mock para obtener la versión mockeada
import * as bcrypt from 'bcryptjs';
const bcryptCompare = bcrypt.compare as jest.Mock;

const makeUser = (overrides = {}) => ({
  id: 1,
  name: 'Admin Test',
  email: 'admin@digitaltickets.com',
  password: '$2a$10$hashedpassword',
  role: 'ADMIN',
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: { user: { findUnique: jest.Mock } };
  let jwtMock: { sign: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      user: { findUnique: jest.fn() },
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    bcryptCompare.mockClear();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {

    it('lanza UnauthorizedException si el email no existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'noexiste@test.com', password: '123' }))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.login({ email: 'noexiste@test.com', password: '123' }))
        .rejects.toThrow('Credenciales incorrectas');
    });

    it('el mensaje de error no revela si el email existe (seguridad)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'noexiste@test.com', password: 'wrong' }))
        .rejects.toThrow('Credenciales incorrectas');
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      bcryptCompare.mockResolvedValue(false);
      await expect(service.login({ email: 'admin@digitaltickets.com', password: 'wrongpass' }))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.login({ email: 'admin@digitaltickets.com', password: 'wrongpass' }))
        .rejects.toThrow('Credenciales incorrectas');
    });

    it('el error de contraseña incorrecta tiene el mismo mensaje que el de email inexistente', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      bcryptCompare.mockResolvedValue(false);
      await expect(service.login({ email: 'admin@digitaltickets.com', password: 'wrong' }))
        .rejects.toThrow('Credenciales incorrectas');
    });

    describe('login exitoso', () => {
      beforeEach(() => {
        prismaMock.user.findUnique.mockResolvedValue(makeUser());
        bcryptCompare.mockResolvedValue(true);
      });

      it('retorna accessToken y datos del usuario', async () => {
        const result = await service.login({
          email: 'admin@digitaltickets.com',
          password: 'admin123',
        });
        expect(result).toMatchObject({
          accessToken: 'mock.jwt.token',
          user: {
            id: 1,
            name: 'Admin Test',
            email: 'admin@digitaltickets.com',
            role: 'ADMIN',
          },
        });
      });

      it('no incluye el password en la respuesta', async () => {
        const result = await service.login({
          email: 'admin@digitaltickets.com',
          password: 'admin123',
        });
        expect(result.user).not.toHaveProperty('password');
      });

      it('genera el JWT con el payload correcto (id, email, role)', async () => {
        await service.login({
          email: 'admin@digitaltickets.com',
          password: 'admin123',
        });
        expect(jwtMock.sign).toHaveBeenCalledWith({
          sub: 1,
          email: 'admin@digitaltickets.com',
          role: 'ADMIN',
        });
      });

      it('genera el JWT con role SUPER_ADMIN cuando corresponde', async () => {
        prismaMock.user.findUnique.mockResolvedValue(
          makeUser({ id: 2, role: 'SUPER_ADMIN', email: 'super@digitaltickets.com' }),
        );
        await service.login({ email: 'super@digitaltickets.com', password: 'admin123' });
        expect(jwtMock.sign).toHaveBeenCalledWith({
          sub: 2,
          email: 'super@digitaltickets.com',
          role: 'SUPER_ADMIN',
        });
      });

      it('genera el JWT con role CAJERO cuando corresponde', async () => {
        prismaMock.user.findUnique.mockResolvedValue(
          makeUser({ id: 3, role: 'CAJERO', email: 'cajero@digitaltickets.com' }),
        );
        await service.login({ email: 'cajero@digitaltickets.com', password: 'admin123' });
        expect(jwtMock.sign).toHaveBeenCalledWith({
          sub: 3,
          email: 'cajero@digitaltickets.com',
          role: 'CAJERO',
        });
      });

      it('llama a bcrypt.compare con el password plano y el hash almacenado', async () => {
        await service.login({
          email: 'admin@digitaltickets.com',
          
          password: 'admin123',
        });
        expect(bcryptCompare).toHaveBeenCalledWith('admin123', '$2a$10$hashedpassword');
      });
    });
  });
});