import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadGatewayException, ConflictException, GatewayTimeoutException } from '@nestjs/common';
import type { PedidosDatos } from './datos.js';
import type { Pedido } from './pedido.js';
import { Pedidos } from './pedidos.js';
import { ProductosCliente } from './productos-cliente.js';

const entrada = { productoId: 1, cantidad: 2 };
const id = '4bce0145-1f71-40ac-96a0-2427c201d331';
const pendiente: Pedido = {
  ...entrada, id, estado: 'PENDIENTE', precioUnitario: null, error: null, creado: new Date(),
};

test('confirma el pedido después del descuento', async (t) => {
  const confirmado = { ...pendiente, estado: 'CONFIRMADO', precioUnitario: '25.50' };
  const confirmar = t.mock.fn(async () => confirmado);
  const descontar = t.mock.fn(async () => ({ precioUnitario: '25.50' }));
  const datos = {
    buscar: t.mock.fn(async () => null),
    pendiente: t.mock.fn(async () => pendiente),
    confirmar,
  } as unknown as PedidosDatos;
  const productos = {
    consultar: t.mock.fn(async () => ({ stock: 5 })), descontar,
  } as unknown as ProductosCliente;
  assert.equal((await new Pedidos(datos, productos).crear(id, entrada)).estado, 'CONFIRMADO');
  assert.deepEqual(descontar.mock.calls[0].arguments, [1, id, 2]);
  assert.deepEqual(confirmar.mock.calls[0].arguments, [id, '25.50']);
});

test('rechaza stock insuficiente antes de descontar', async (t) => {
  const descontar = t.mock.fn();
  const datos = { buscar: t.mock.fn(async () => null) } as unknown as PedidosDatos;
  const productos = { consultar: async () => ({ stock: 1 }), descontar } as unknown as ProductosCliente;
  await assert.rejects(new Pedidos(datos, productos).crear(id, entrada), ConflictException);
  assert.equal(descontar.mock.callCount(), 0);
});

test('un timeout conserva el pedido pendiente para reintentar con la misma clave', async (t) => {
  const confirmar = t.mock.fn();
  const rechazar = t.mock.fn();
  const datos = { buscar: async () => pendiente, confirmar, rechazar } as unknown as PedidosDatos;
  const descontar = t.mock.fn(async () => { throw new GatewayTimeoutException(); });
  const productos = { descontar } as unknown as ProductosCliente;
  await assert.rejects(new Pedidos(datos, productos).crear(id, entrada), GatewayTimeoutException);
  assert.deepEqual(descontar.mock.calls[0].arguments, [1, id, 2]);
  assert.equal(confirmar.mock.callCount(), 0);
  assert.equal(rechazar.mock.callCount(), 0);
});

test('un token interno rechazado se reporta como fallo de la dependencia', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 401 }));
  await assert.rejects(new ProductosCliente().consultar(1), BadGatewayException);
});
