import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from './producto.entity';

@Entity('venta_items')
export class VentaItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ventaId: string;

    @ManyToOne(() => Venta, venta => venta.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ventaId' })
    venta: Venta;

    @Column({ nullable: true })
    productoId: string;

    @ManyToOne(() => Producto, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'productoId' })
    producto: Producto;

    @Column()
    nombre: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column('int')
    cantidad: number;
}
