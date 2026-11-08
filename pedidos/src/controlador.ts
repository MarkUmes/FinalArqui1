import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsInt, isUUID, Max, Min } from 'class-validator';
import type { Pedido } from './pedido.js';
import { Pedidos } from './pedidos.js';

class CrearPedido {
  @ApiProperty({ example: 1, minimum: 1, type: 'integer' })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productoId!: number;

  @ApiProperty({ example: 2, minimum: 1, type: 'integer' })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  cantidad!: number;
}

class PedidoVista {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  productoId!: number;

  @ApiProperty()
  cantidad!: number;

  @ApiProperty({ type: String, nullable: true, example: '25.50' })
  precioUnitario!: string | null;

  @ApiProperty({ enum: ['PENDIENTE', 'CONFIRMADO', 'RECHAZADO'] })
  estado!: Pedido['estado'];

  @ApiProperty({ type: Date })
  creado!: Date;

  static desde({ id, productoId, cantidad, precioUnitario, estado, creado }: Pedido): PedidoVista {
    return { id, productoId, cantidad, precioUnitario, estado, creado };
  }
}

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: Pedidos) {}

  @Get()
  @ApiOkResponse({ type: [PedidoVista] })
  async listar(): Promise<PedidoVista[]> {
    return (await this.pedidos.listar()).map(PedidoVista.desde);
  }

  @Get(':id')
  @ApiOkResponse({ type: PedidoVista })
  async buscar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<PedidoVista> {
    return PedidoVista.desde(await this.pedidos.buscar(id.toLowerCase()));
  }

  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID v4. Repetir la clave al reintentar.' })
  @ApiCreatedResponse({ type: PedidoVista })
  async crear(
    @Headers('idempotency-key') clave: string | undefined,
    @Body() entrada: CrearPedido,
  ): Promise<PedidoVista> {
    // Validar la clave antes de consultar cualquier servicio.
    if (!clave || !isUUID(clave, '4')) throw new BadRequestException('Idempotency-Key debe ser un UUID v4');
    return PedidoVista.desde(await this.pedidos.crear(clave.toLowerCase(), entrada));
  }
}
