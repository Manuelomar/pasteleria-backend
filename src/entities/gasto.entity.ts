import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('gastos')
export class Gasto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    monto: number;

    @Column({ type: 'timestamp' })
    fecha: Date;

    @Column({ nullable: true })
    productoId: string;

    @ManyToOne(() => Producto, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'productoId' })
    producto: Producto;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
