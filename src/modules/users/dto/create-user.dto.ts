import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsEmail, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserPermissionsDto {
    @IsOptional() clientes: boolean;
    @IsOptional() clientes_crear: boolean;
    @IsOptional() clientes_editar: boolean;
    @IsOptional() clientes_eliminar: boolean;
    @IsOptional() catalogo: boolean;
    @IsOptional() catalogo_crear: boolean;
    @IsOptional() catalogo_editar: boolean;
    @IsOptional() catalogo_eliminar: boolean;
    @IsOptional() ventas: boolean;
    @IsOptional() ventas_crear: boolean;
    @IsOptional() ventas_editar: boolean;
    @IsOptional() ventas_eliminar: boolean;
    @IsOptional() ventas_registrarPago: boolean;
    @IsOptional() graficos: boolean;
    @IsOptional() graficos_filtroAmbos: boolean;
    @IsOptional() graficos_filtroConItbis: boolean;
    @IsOptional() graficos_filtroSinItbis: boolean;
    @IsOptional() estadoCuenta: boolean;
    @IsOptional() estadoCuenta_exportar: boolean;
    @IsOptional() estadoCuenta_filtros: boolean;
}

export class CreateUserDto {
    @ApiProperty()
    @IsString({ message: 'El nombre de usuario debe ser texto' })
    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    username: string;

    @ApiProperty()
    @IsString({ message: 'La contraseña debe ser texto' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string;

    @ApiProperty()
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    name: string;

    @ApiProperty({ enum: ['admin', 'usuario'] })
    @IsEnum(['admin', 'usuario'], { message: 'El rol debe ser "admin" o "usuario"' })
    role: 'admin' | 'usuario';

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
    activo?: boolean;

    @ApiProperty()
    @ValidateNested()
    @Type(() => UserPermissionsDto)
    permissions: UserPermissionsDto;
}
