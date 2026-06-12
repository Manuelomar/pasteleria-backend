import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente.entity';

export type TipoMovimiento = 'venta' | 'pago' | 'ajuste';
export type EstadoPago = 'pagado' | 'pendiente' | 'parcial';

@Entity('movimientos')
export class Movimiento {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clienteId: string;

    @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clienteId' })
    cliente: Cliente;

    @Column({ type: 'date' })
    fecha: Date;

    @Column({ type: 'enum', enum: ['venta', 'pago', 'ajuste'] })
    tipo: TipoMovimiento;

    @Column({ nullable: true })
    factura: string;

    @Column('text')
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    monto: number;

    @Column('decimal', { precision: 10, scale: 2 })
    balanceRestante: number;

    @Column({ type: 'enum', enum: ['pagado', 'pendiente', 'parcial'] })
    estado: EstadoPago;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
