import { timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Autenticacion } from './autenticacion.js';
import { variable } from './config.js';

function bearer(contexto: ExecutionContext): string | undefined {
  const encabezado = contexto.switchToHttp().getRequest<Request>().headers.authorization;
  return encabezado?.match(/^Bearer ([^ ]+)$/i)?.[1];
}

function esServicio(token: string | undefined): boolean {
  if (!token) return false;
  const recibido = Buffer.from(token);
  const esperado = Buffer.from(variable('SERVICIO_TOKEN'));
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly auth: Autenticacion) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    await this.auth.verificar(bearer(contexto));
    return true;
  }
}

@Injectable()
export class LecturaGuard implements CanActivate {
  constructor(private readonly auth: Autenticacion) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const token = bearer(contexto);
    if (!esServicio(token)) await this.auth.verificar(token);
    return true;
  }
}

@Injectable()
export class ServicioGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    if (!esServicio(bearer(contexto))) {
      throw new UnauthorizedException('Credencial de servicio inválida');
    }
    return true;
  }
}
