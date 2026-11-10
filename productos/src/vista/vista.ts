import { ApiProperty } from '@nestjs/swagger';
import type { Producto } from '../modelo/modelos.js';

export class DescuentoVista {
  @ApiProperty({ example: '25.50' })
  precioUnitario!: string;
}

export class ProductoVista {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty({ example: '25.50' })
  precio!: string;

  @ApiProperty({ example: 5, minimum: 0, type: 'integer' })
  stock!: number;

  static desde(producto: Producto): ProductoVista {
    const { id, nombre, precio, stock } = producto;
    return { id, nombre, precio, stock };
  }
}
