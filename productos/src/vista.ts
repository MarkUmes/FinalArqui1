import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import type { Producto } from './modelos.js';

export class CrearProducto {
  @ApiProperty({ example: 'Café', minLength: 1, maxLength: 120 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 120)
  nombre!: string;

  @ApiProperty({ example: 25.5, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  precio!: number;

  @ApiProperty({ example: 5, minimum: 1, type: 'integer' })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  stock!: number;
}

export class ActualizarProducto extends PartialType(CrearProducto, { skipNullProperties: false }) {}

export class SolicitarDescuento {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  pedidoId!: string;

  @ApiProperty({ example: 2, minimum: 1, type: 'integer' })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  cantidad!: number;
}

export class DescuentoVista {
  @ApiProperty({ example: '25.50' })
  precioUnitario!: string;
}

// La vista REST decide qué campos del modelo aparecen en el JSON.
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
