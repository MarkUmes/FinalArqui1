import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CrearProducto {
  @ApiProperty({ example: 'Café', minLength: 1, maxLength: 120 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(1, 120, { message: 'El nombre debe tener entre 1 y 120 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 25.5, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con hasta dos decimales' })
  @Min(0.01, { message: 'El precio debe ser de al menos 0.01' })
  @Max(99999999.99, { message: 'El precio no puede superar 99999999.99' })
  precio!: number;

  @ApiProperty({ example: 5, minimum: 1, type: 'integer' })
  @IsInt({ message: 'Las existencias deben ser un número entero' })
  @Min(1, { message: 'Las existencias deben ser de al menos 1 unidad' })
  @Max(2147483647, { message: 'Las existencias no pueden superar 2147483647 unidades' })
  stock!: number;
}

export class ActualizarProducto extends PartialType(CrearProducto, { skipNullProperties: false }) {}

export class SolicitarDescuento {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El identificador del pedido debe ser un UUID v4' })
  pedidoId!: string;

  @ApiProperty({ example: 2, minimum: 1, type: 'integer' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser de al menos 1 unidad' })
  @Max(2147483647, { message: 'La cantidad no puede superar 2147483647 unidades' })
  cantidad!: number;
}
