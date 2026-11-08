import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './pedido.js';

export interface EntradaPedido {
  productoId: number;
  cantidad: number;
}

@Injectable()
export class PedidosDatos {
  constructor(@InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>) {}

  listar(): Promise<Pedido[]> {
    return this.pedidos.find({ order: { creado: 'DESC', id: 'DESC' } });
  }

  buscar(id: string): Promise<Pedido | null> {
    return this.pedidos.findOneBy({ id });
  }

  async pendiente(id: string, entrada: EntradaPedido): Promise<Pedido> {
    // Si llegaron dos solicitudes con la misma clave, ambas recuperan la misma fila.
    await this.pedidos.createQueryBuilder().insert()
      .values({ id, ...entrada, estado: 'PENDIENTE' }).orIgnore().execute();
    return this.pedidos.findOneByOrFail({ id });
  }

  async confirmar(id: string, precioUnitario: string): Promise<Pedido> {
    await this.pedidos.update({ id, estado: 'PENDIENTE' }, { estado: 'CONFIRMADO', precioUnitario });
    return this.pedidos.findOneByOrFail({ id });
  }

  async rechazar(id: string, error: number): Promise<void> {
    await this.pedidos.update({ id, estado: 'PENDIENTE' }, { estado: 'RECHAZADO', error });
  }
}
