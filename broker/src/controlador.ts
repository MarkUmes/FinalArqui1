import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import type { Request, Response } from 'express';
import { Autenticacion } from './autenticacion.js';
import { JwtGuard, LecturaGuard, ServicioGuard } from './guardas.js';
import { Proxy } from './proxy.js';

class Login {
  @ApiProperty({ example: 'demo' })
  @IsString({ message: 'El usuario debe ser texto' })
  @Length(1, 80, { message: 'El usuario debe tener entre 1 y 80 caracteres' })
  usuario!: string;

  @ApiProperty({ format: 'password' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @Length(1, 128, { message: 'La contraseña debe tener entre 1 y 128 caracteres' })
  password!: string;
}

const camposProducto = {
  nombre: { type: 'string', minLength: 1, maxLength: 120, example: 'Café' },
  precio: { type: 'number', minimum: 0.01, multipleOf: 0.01, example: 25.5 },
  stock: { type: 'integer', minimum: 1, example: 5 },
};
const cantidad = { type: 'integer', minimum: 1, example: 2 };

@ApiTags('Broker')
@Controller()
export class BrokerController {
  constructor(
    private readonly auth: Autenticacion,
    private readonly proxy: Proxy,
  ) {}

  @Get('salud')
  salud(): { estado: string } {
    return { estado: 'activo' };
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia sesión y devuelve un JWT' })
  login(@Body() entrada: Login): Promise<{ token: string }> {
    return this.auth.login(entrada.usuario, entrada.password);
  }

  @Get('productos')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  listarProductos(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res);
  }

  @Get('productos/:id')
  @UseGuards(LecturaGuard)
  @ApiBearerAuth()
  @ApiBearerAuth('servicio')
  @ApiParam({ name: 'id', type: Number })
  buscarProducto(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res);
  }

  @Post('productos')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: 'object', properties: camposProducto, required: ['nombre', 'precio', 'stock'] } })
  crearProducto(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res);
  }

  @Patch('productos/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { type: 'object', properties: camposProducto } })
  actualizarProducto(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res);
  }

  @Delete('productos/:id')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  borrarProducto(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res);
  }

  @Get('pedidos')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  listarPedidos(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('pedidos', req, res);
  }

  @Get('pedidos/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  buscarPedido(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('pedidos', req, res);
  }

  @Post('pedidos')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID v4. Reutilizar la clave al reintentar.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { productoId: { type: 'integer', minimum: 1 }, cantidad },
      required: ['productoId', 'cantidad'],
    },
  })
  crearPedido(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('pedidos', req, res);
  }

  @Post('interno/productos/:id/descuentos')
  @HttpCode(200)
  @UseGuards(ServicioGuard)
  @ApiBearerAuth('servicio')
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { pedidoId: { type: 'string', format: 'uuid' }, cantidad },
      required: ['pedidoId', 'cantidad'],
    },
  })
  descontar(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxy.enviar('productos', req, res, true);
  }
}
