import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PedidosDatos } from './datos.js';
import type { EntradaPedido } from './datos.js';
import type { Pedido } from './pedido.js';
import { ProductosCliente } from './productos-cliente.js';

@Injectable()
export class Pedidos {
  constructor(
    private readonly datos: PedidosDatos,
    private readonly productos: ProductosCliente,
  ) {}

  listar(): Promise<Pedido[]> {
    return this.datos.listar();
  }

  async buscar(id: string): Promise<Pedido> {
    const pedido = await this.datos.buscar(id);
    if (!pedido) throw new NotFoundException('El pedido no existe');
    return pedido;
  }

  async crear(id: string, entrada: EntradaPedido): Promise<Pedido> {
    const { productoId, cantidad } = entrada;
    let pedido = await this.datos.buscar(id);
    if (!pedido) {
      try {
        const producto = await this.productos.consultar(productoId);
        if (producto.stock < cantidad) throw new ConflictException('Existencias insuficientes');
      } catch (error) {
        // Otra solicitud con esta clave pudo confirmar mientras se consultaba el stock.
        pedido = await this.datos.buscar(id);
        if (!pedido) throw error;
      }
      pedido ??= await this.datos.pendiente(id, entrada);
    }

    if (pedido.productoId !== productoId || pedido.cantidad !== cantidad) {
      throw new ConflictException('La clave de idempotencia ya se usó con otros datos');
    }
    if (pedido.estado === 'CONFIRMADO') return pedido;
    if (pedido.estado === 'RECHAZADO') {
      if (pedido.error === 404) throw new NotFoundException('El producto no existe');
      throw new ConflictException('Existencias insuficientes');
    }

    // Tras un timeout, reutilizar el mismo id recupera el resultado del descuento anterior.
    let descuento: { precioUnitario: string };
    try {
      descuento = await this.productos.descontar(productoId, id, cantidad);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        await this.datos.rechazar(id, error.getStatus());
      }
      throw error;
    }

    return this.datos.confirmar(id, descuento.precioUnitario);
  }
}
