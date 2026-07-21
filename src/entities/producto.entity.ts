import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TipoProducto = 'dulce' | 'salado' | 'bebida' | 'material';

@Entity('productos')
export class Producto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column()
    categoria: string;

    @Column({ type: 'enum', enum: ['dulce', 'salado', 'bebida', 'material'], default: 'dulce' })
    tipo: TipoProducto;

    @Column({ nullable: true })
    proveedorId: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    precioCosto: number;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    precioUber: number;

    @Column({ default: true })
    disponible: boolean;

    @Column('text', { nullable: true })
    imagen: string;

    @Column('text', { nullable: true })
    descripcion: string;

    @Column({ default: 0 })
    vendidos: number;

    @Column({ type: 'int', default: 0 })
    cantidad: number;

    @Column({ type: 'jsonb', nullable: true, default: [] })
    historialCostos: number[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
