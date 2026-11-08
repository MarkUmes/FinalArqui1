import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  // MySQL entrega DECIMAL como texto para conservar los centavos.
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: string;

  @Column({ type: 'int' })
  stock!: number;
}

@Entity('descuentos')
export class Descuento {
  @PrimaryColumn({ name: 'pedido_id', type: 'char', length: 36 })
  pedidoId!: string;

  @Column({ name: 'producto_id', type: 'int' })
  productoId!: number;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'smallint', nullable: true })
  resultado!: number | null;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario!: string | null;
}
