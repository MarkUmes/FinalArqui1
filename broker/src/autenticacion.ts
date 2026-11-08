import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { jwtVerify, SignJWT } from 'jose';
import { Column, Entity, PrimaryColumn, Repository } from 'typeorm';
import { variable } from './config.js';

@Entity('usuarios')
export class Usuario {
  @PrimaryColumn({ length: 80 })
  usuario!: string;

  @Column({ length: 160 })
  clave!: string;
}

const derivar = promisify(scrypt);

@Injectable()
export class Autenticacion implements OnModuleInit {
  constructor(@InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>) {}

  async onModuleInit(): Promise<void> {
    const usuario = variable('ADMIN_USUARIO');
    if (await this.usuarios.findOneBy({ usuario })) return;

    // La cuenta inicial se guarda como sal y hash. La contraseña viene del entorno.
    const sal = randomBytes(16).toString('hex');
    const hash = await derivar(variable('ADMIN_PASSWORD'), sal, 48) as Buffer;
    const clave = `${sal}:${hash.toString('hex')}`;
    await this.usuarios.createQueryBuilder().insert().values({ usuario, clave }).orIgnore().execute();
  }

  async login(usuario: string, password: string): Promise<{ token: string }> {
    const cuenta = await this.usuarios.findOneBy({ usuario });
    if (!cuenta) throw new UnauthorizedException('Credenciales inválidas');

    const [sal, hash] = cuenta.clave.split(':');
    const esperado = Buffer.from(hash, 'hex');
    const recibido = await derivar(password, sal, 48) as Buffer;
    if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(cuenta.usuario)
      .setIssuer('tienda')
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(Buffer.from(variable('JWT_SECRETO')));
    return { token };
  }

  async verificar(token: string | undefined): Promise<void> {
    try {
      if (!token) throw new Error('Falta el token');
      await jwtVerify(token, Buffer.from(variable('JWT_SECRETO')), {
        algorithms: ['HS256'],
        issuer: 'tienda',
        requiredClaims: ['exp', 'sub'],
      });
    } catch {
      throw new UnauthorizedException('Token ausente, inválido o expirado');
    }
  }
}
