import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TipoSolicitud = 'bizcocho' | 'combo';
export type EstadoSolicitud = 'pendiente' | 'en-proceso' | 'completada' | 'cancelada';

@Entity('solicitudes')
export class Solicitud {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ['bizcocho', 'combo'], default: 'bizcocho' })
    tipo: TipoSolicitud;

    @Column()
    nombre: string;

    @Column()
    apellido: string;

    @Column({ nullable: true })
    correo: string;

    @Column()
    telefono: string;

    @Column({ type: 'jsonb', nullable: true })
    configuracion: Record<string, any>;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    precioEstimado: number;

    @Column({ nullable: true })
    imagenReferencia: string;

    @Column({ type: 'enum', enum: ['pendiente', 'en-proceso', 'completada', 'cancelada'], default: 'pendiente' })
    estado: EstadoSolicitud;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
