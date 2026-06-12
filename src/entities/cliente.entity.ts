import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column()
    telefono: string;

    @Column({ nullable: true })
    correo: string;

    @Column('text', { nullable: true })
    direccion: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column({ nullable: true })
    ultimaCompra: string; // ISO date string or Date depending on frontend

    @Column({ default: true })
    activo: boolean;

    @Column('text', { nullable: true })
    nota: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalComprado: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    totalPagado: number;

    @Column({ nullable: true })
    ultimoPago: string; // ISO date string

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
