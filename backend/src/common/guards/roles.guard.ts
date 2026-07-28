import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requis = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requis || requis.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requis.includes(user.role)) {
      throw new ForbiddenException({
        succes: false,
        message: "Vous n'avez pas les droits nécessaires pour cette action.",
        code: 'ACCES_REFUSE',
      });
    }
    return true;
  }
}
