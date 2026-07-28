import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface MembreAuth {
  id: string;
  email: string;
  role: string;
  typeMembre: string;
}

export const MembreCourant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MembreAuth => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as MembreAuth;
  },
);
