import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { EntregaItem } from './entrega-item.entity';
import { User } from './user.entity';

export type EstadoEntrega = "en_espera" | "entregada";
export type EstadoPagoEntrega = "pendiente_pago" | "pagado";

@Entity('entregas')
export class Entrega {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    proveedorId: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proveedorId' })
    proveedor: User;

    @OneToMany(() => EntregaItem, item => item.entrega, { cascade: true, eager: true })
    items: EntregaItem[];

    @Column({ type: 'enum', enum: ['en_espera', 'entregada'], default: 'en_espera' })
    estadoEntrega: EstadoEntrega;

    @Column({ type: 'enum', enum: ['pendiente_pago', 'pagado'], default: 'pendiente_pago' })
    estadoPago: EstadoPagoEntrega;

    @Column({ type: 'timestamp' })
    fechaPrevista: Date;

    @Column({ type: 'timestamp', nullable: true })
    fechaReal: Date;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalCosto: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
