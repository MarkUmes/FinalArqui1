import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { ActualizarProducto, CrearProducto, SolicitarDescuento } from './controlador/entradas.js';
import { Descuento, Producto } from './modelo/modelos.js';
import type { DescuentoVista } from './vista/vista.js';

@Injectable()
export class Productos {
  constructor(
    @InjectRepository(Producto) private readonly productos: Repository<Producto>,
    private readonly db: DataSource,
  ) {}

  listar(): Promise<Producto[]> {
    return this.productos.find({ order: { id: 'ASC' } });
  }

  async buscar(id: number): Promise<Producto> {
    const producto = await this.productos.findOneBy({ id });
    if (!producto) throw new NotFoundException('El producto no existe');
    return producto;
  }

  crear(entrada: CrearProducto): Promise<Producto> {
    return this.productos.save({ ...entrada, precio: entrada.precio.toFixed(2) });
  }

  async actualizar(id: number, entrada: ActualizarProducto): Promise<Producto> {
    const { precio, ...campos } = entrada;
    const cambios = precio === undefined ? campos : { ...campos, precio: precio.toFixed(2) };
    if (!Object.keys(cambios).length) throw new BadRequestException('Envía al menos un campo');
    await this.productos.update(id, cambios);
    return this.buscar(id);
  }

  async borrar(id: number): Promise<void> {
    const { affected } = await this.productos.delete(id);
    if (!affected) throw new NotFoundException('El producto no existe');
  }

  async descontar(productoId: number, entrada: SolicitarDescuento): Promise<DescuentoVista> {
    const { pedidoId, cantidad } = entrada;

    const movimiento = await this.db.transaction(async (tx) => {
      const descuentos = tx.getRepository(Descuento);

      await descuentos.createQueryBuilder().insert().values({ pedidoId, productoId, cantidad })
        .orUpdate(['pedido_id']).execute();
      const registro = await descuentos.findOneOrFail({
        where: { pedidoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (registro.productoId !== productoId || registro.cantidad !== cantidad) {
        throw new ConflictException('El identificador ya está asociado a otro descuento');
      }
      if (registro.resultado !== null) return registro;

      const productos = tx.getRepository(Producto);
      const producto = await productos.findOne({
        where: { id: productoId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!producto) {
        registro.resultado = 404;
      } else if (producto.stock < cantidad) {
        registro.resultado = 409;
      } else {
        producto.stock -= cantidad;
        registro.precioUnitario = producto.precio;
        registro.resultado = 200;
        await productos.save(producto);
      }
      return descuentos.save(registro);
    });

    if (movimiento.resultado === 404) throw new NotFoundException('El producto no existe');
    if (movimiento.resultado === 409) throw new ConflictException('Existencias insuficientes');
    return { precioUnitario: movimiento.precioUnitario! };
  }
}
