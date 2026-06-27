import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Entrega } from './entrega.entity';
import { Producto } from './producto.entity';

@Entity('entrega_items')
export class EntregaItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    entregaId: string;

    @ManyToOne(() => Entrega, entrega => entrega.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'entregaId' })
    entrega: Entrega;

    @Column()
    productoId: string;

    @ManyToOne(() => Producto, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'productoId' })
    producto: Producto;

    @Column('int')
    cantidad: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    precioCosto: number;
}
