import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export type Estado = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';

@Entity('pedidos')
export class Pedido {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'producto_id', type: 'int' })
  productoId!: number;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario!: string | null;

  @Column({ type: 'varchar', length: 12 })
  estado!: Estado;

  @Column({ type: 'smallint', nullable: true })
  error!: number | null;

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  creado!: Date;
}
