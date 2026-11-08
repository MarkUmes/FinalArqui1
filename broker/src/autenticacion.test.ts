import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { SignJWT } from 'jose';
import type { Repository } from 'typeorm';
import { Autenticacion } from './autenticacion.js';
import type { Usuario } from './autenticacion.js';

test('la autenticación rechaza un JWT ausente', async () => {
  const auth = new Autenticacion({} as Repository<Usuario>);
  await assert.rejects(auth.verificar(undefined), UnauthorizedException);
});

test('la autenticación verifica firma, emisor y expiración', async () => {
  process.env.JWT_SECRETO = 'secreto-solo-de-prueba-32-caracteres';
  const firmar = (exp: string, secreto: string) => new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('tienda')
    .setSubject('demo')
    .setExpirationTime(exp)
    .sign(Buffer.from(secreto));

  const auth = new Autenticacion({} as Repository<Usuario>);
  await auth.verificar(await firmar('1m', process.env.JWT_SECRETO));
  await assert.rejects(auth.verificar(await firmar('1m', 'otra-firma')), UnauthorizedException);
  await assert.rejects(auth.verificar(await firmar('-1m', process.env.JWT_SECRETO)), UnauthorizedException);
});

test('el login consulta el usuario con el repositorio', async (t) => {
  const findOneBy = t.mock.fn(async () => null);
  const auth = new Autenticacion({ findOneBy } as unknown as Repository<Usuario>);
  await assert.rejects(auth.login('demo', 'clave'), UnauthorizedException);
  assert.deepEqual(findOneBy.mock.calls[0].arguments, [{ usuario: 'demo' }]);
});
