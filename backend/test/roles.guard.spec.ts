import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';

function contexte(user: any, roles: any[]) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  const ctx: any = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return { guard: new RolesGuard(reflector), ctx };
}

describe('RolesGuard', () => {
  it('laisse passer si aucun rôle requis', () => {
    const { guard, ctx } = contexte({ role: 'MEMBRE' }, []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('laisse passer un ADMIN sur une route ADMIN', () => {
    const { guard, ctx } = contexte({ role: 'ADMIN' }, ['ADMIN']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuse un MEMBRE sur une route ADMIN', () => {
    const { guard, ctx } = contexte({ role: 'MEMBRE' }, ['ADMIN']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
