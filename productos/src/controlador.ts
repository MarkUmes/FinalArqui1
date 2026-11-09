import {
  BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, ParseIntPipe, Patch, Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { Productos } from './productos.js';
import { ActualizarProducto, CrearProducto, DescuentoVista, ProductoVista, SolicitarDescuento } from './vista.js';

const idProducto = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('El identificador del producto debe ser un número entero'),
});

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: Productos) {}

  @Get()
  @ApiOkResponse({ type: [ProductoVista] })
  async listar(): Promise<ProductoVista[]> {
    return (await this.productos.listar()).map(ProductoVista.desde);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductoVista })
  async buscar(@Param('id', idProducto) id: number): Promise<ProductoVista> {
    return ProductoVista.desde(await this.productos.buscar(id));
  }

  @Post()
  @ApiCreatedResponse({ type: ProductoVista })
  async crear(@Body() entrada: CrearProducto): Promise<ProductoVista> {
    return ProductoVista.desde(await this.productos.crear(entrada));
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProductoVista })
  async actualizar(
    @Param('id', idProducto) id: number,
    @Body() entrada: ActualizarProducto,
  ): Promise<ProductoVista> {
    return ProductoVista.desde(await this.productos.actualizar(id, entrada));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  borrar(@Param('id', idProducto) id: number): Promise<void> {
    return this.productos.borrar(id);
  }
}

@ApiTags('Inventario interno')
@Controller('interno/productos')
export class InventarioController {
  constructor(private readonly productos: Productos) {}

  @Post(':id/descuentos')
  @HttpCode(200)
  @ApiHeader({ name: 'X-Servicio-Token', required: true })
  @ApiOperation({ summary: 'Descuenta stock una vez por pedido' })
  @ApiOkResponse({ type: DescuentoVista })
  descontar(
    @Param('id', idProducto) id: number,
    @Body() entrada: SolicitarDescuento,
    @Headers('x-servicio-token') token: string | undefined,
  ): Promise<DescuentoVista> {
    // Este encabezado lo agrega el broker al reenviar una operación interna autenticada.
    if (!token || token !== process.env.SERVICIO_TOKEN) {
      throw new UnauthorizedException('Credencial de servicio inválida');
    }
    return this.productos.descontar(id, entrada);
  }
}
