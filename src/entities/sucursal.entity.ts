import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sucursales')
export class Sucursal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    nombre: string;

    @Column({ unique: true })
    codigo: string; // Ej: "AR", "LJ" — prefijo para facturas

    @Column('text', { nullable: true })
    direccion: string | null;

    @Column({ nullable: true })
    telefono: string | null;

    @Column({ default: true })
    activa: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
