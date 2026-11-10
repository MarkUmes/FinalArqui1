import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import type { DataSource, Repository } from 'typeorm';
import { CrearProducto } from './controlador/entradas.js';
import type { Producto } from './modelo/modelos.js';
import { Productos } from './productos.js';

test('crear conserva el precio con dos decimales', async (t) => {
  const save = t.mock.fn(async (producto: Omit<Producto, 'id'>) => ({ id: 1, ...producto }));
  const servicio = new Productos({ save } as unknown as Repository<Producto>, {} as DataSource);
  const producto = await servicio.crear({ nombre: 'Café', precio: 25.5, stock: 5 });
  assert.equal(producto.precio, '25.50');
  assert.equal(save.mock.callCount(), 1);
});

test('buscar devuelve 404 cuando el repositorio no encuentra el producto', async (t) => {
  const findOneBy = t.mock.fn(async () => null);
  const servicio = new Productos({ findOneBy } as unknown as Repository<Producto>, {} as DataSource);
  await assert.rejects(servicio.buscar(99), NotFoundException);
});

test('un producto nuevo requiere precio y stock positivos', async () => {
  const entrada = Object.assign(new CrearProducto(), { nombre: 'Café', precio: 0, stock: 0 });
  const errores = await validate(entrada);
  assert.deepEqual(errores.map((error) => error.property), ['precio', 'stock']);
  assert.deepEqual(errores.map((error) => error.constraints?.min), [
    'El precio debe ser de al menos 0.01',
    'Las existencias deben ser de al menos 1 unidad',
  ]);
});
