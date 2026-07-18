import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TipoProducto = 'dulce' | 'salado' | 'bebida';

@Entity('categorias')
export class Categoria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    nombre: string;

    @Column({ type: 'enum', enum: ['dulce', 'salado', 'bebida'], default: 'dulce' })
    tipo: TipoProducto;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
