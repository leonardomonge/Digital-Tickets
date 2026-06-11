import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

// ─────────────────────────────────────────────
// HELPER — crea un ExecutionContext falso
// El guard necesita acceder al request y a los metadatos
// del handler/clase, así que simulamos toda esa estructura.
// ─────────────────────────────────────────────
const makeContext = (userRole: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: userRole } }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext);

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // Rutas sin restricción de roles
  // ═══════════════════════════════════════════
  describe('rutas sin roles requeridos', () => {
    it('permite el acceso si la ruta no tiene decorator @Roles', () => {
      // Cuando no hay @Roles en el endpoint, reflector retorna undefined
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(makeContext('CAJERO'));

      expect(result).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // SUPER_ADMIN — acceso total
  // ═══════════════════════════════════════════
  describe('SUPER_ADMIN', () => {
    it('accede a rutas exclusivas de SUPER_ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);

      const result = guard.canActivate(makeContext('SUPER_ADMIN'));

      expect(result).toBe(true);
    });

    it('accede a rutas compartidas con ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'ADMIN']);

      const result = guard.canActivate(makeContext('SUPER_ADMIN'));

      expect(result).toBe(true);
    });

    it('accede a rutas compartidas con todos los roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'ADMIN', 'CAJERO']);

      const result = guard.canActivate(makeContext('SUPER_ADMIN'));

      expect(result).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // ADMIN — todo excepto gestión de usuarios
  // ═══════════════════════════════════════════
  describe('ADMIN', () => {
    it('accede a rutas permitidas para ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'ADMIN']);

      const result = guard.canActivate(makeContext('ADMIN'));

      expect(result).toBe(true);
    });

    it('lanza ForbiddenException al intentar acceder a ruta exclusiva de SUPER_ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);

      expect(() => guard.canActivate(makeContext('ADMIN')))
        .toThrow(ForbiddenException);

      expect(() => guard.canActivate(makeContext('ADMIN')))
        .toThrow('No tenés permisos para acceder a este recurso');
    });
  });

  // ═══════════════════════════════════════════
  // CAJERO — solo puede activar el escáner
  // ═══════════════════════════════════════════
  describe('CAJERO', () => {
    it('accede a rutas permitidas para CAJERO', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'ADMIN', 'CAJERO']);

      const result = guard.canActivate(makeContext('CAJERO'));

      expect(result).toBe(true);
    });

    it('lanza ForbiddenException al intentar acceder a rutas de ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'ADMIN']);

      expect(() => guard.canActivate(makeContext('CAJERO')))
        .toThrow(ForbiddenException);
    });

    it('lanza ForbiddenException al intentar acceder a rutas exclusivas de SUPER_ADMIN', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);

      expect(() => guard.canActivate(makeContext('CAJERO')))
        .toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════
  // Verificaciones del Reflector
  // ═══════════════════════════════════════════
  describe('uso correcto del Reflector', () => {
    it('consulta los metadatos con la clave ROLES_KEY correcta', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = makeContext('ADMIN');

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });
});