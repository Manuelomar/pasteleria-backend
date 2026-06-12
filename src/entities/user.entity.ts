import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export class UserPermissions {
    @ApiProperty() clientes: boolean;
    @ApiProperty() clientes_crear: boolean;
    @ApiProperty() clientes_editar: boolean;
    @ApiProperty() clientes_eliminar: boolean;
    @ApiProperty() catalogo: boolean;
    @ApiProperty() catalogo_crear: boolean;
    @ApiProperty() catalogo_editar: boolean;
    @ApiProperty() catalogo_eliminar: boolean;
    @ApiProperty() ventas: boolean;
    @ApiProperty() ventas_crear: boolean;
    @ApiProperty() ventas_editar: boolean;
    @ApiProperty() ventas_eliminar: boolean;
    @ApiProperty() ventas_registrarPago: boolean;
    @ApiProperty() graficos: boolean;
    @ApiProperty() graficos_filtroAmbos: boolean;
    @ApiProperty() graficos_filtroConItbis: boolean;
    @ApiProperty() graficos_filtroSinItbis: boolean;
    @ApiProperty() estadoCuenta: boolean;
    @ApiProperty() estadoCuenta_exportar: boolean;
    @ApiProperty() estadoCuenta_filtros: boolean;
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ select: false })
    password: string;

    @Column()
    name: string;

    @Column({ default: 'vendedor' })
    role: 'administrador' | 'cajero' | 'vendedor' | 'supervisor';

    @Column({ type: 'jsonb' })
    permissions: UserPermissions;

    @CreateDateColumn()
    createdAt: Date;
}
