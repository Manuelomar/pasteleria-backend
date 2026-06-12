import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { VentaItem } from './venta-item.entity';
import { Cliente } from './cliente.entity';

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";
export type EstadoPago = "pagado" | "pendiente" | "parcial";

@Entity('ventas')
export class Venta {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    factura: string;

    @Column({ nullable: true })
    clienteId: string;

    @ManyToOne(() => Cliente, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clienteId' })
    cliente: Cliente;

    @Column({ nullable: true })
    clienteNombre: string;

    @OneToMany(() => VentaItem, item => item.venta, { cascade: true, eager: true })
    items: VentaItem[];

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    descuento: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    impuesto: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    total: number;

    @Column({ type: 'enum', enum: ['efectivo', 'tarjeta', 'transferencia'], default: 'efectivo' })
    metodoPago: MetodoPago;

    @Column({ type: 'enum', enum: ['pagado', 'pendiente', 'parcial'], default: 'pagado' })
    estadoPago: EstadoPago;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    montoPagado: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column({ nullable: true })
    cajeroId: string;

    @Column({ type: 'timestamp' })
    fecha: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
