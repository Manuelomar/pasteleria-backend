import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSucursalDto {
    @ApiProperty({ description: 'Nombre de la sucursal', example: 'Bizcochao Alma Rosa' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @ApiProperty({ description: 'Código único para prefijo de facturas', example: 'AR' })
    @IsString({ message: 'El código debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El código es obligatorio' })
    codigo: string;

    @ApiProperty({ description: 'Dirección física de la sucursal', required: false })
    @IsOptional()
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    direccion?: string;

    @ApiProperty({ description: 'Teléfono de contacto', required: false })
    @IsOptional()
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    telefono?: string;

    @ApiProperty({ description: 'Indica si la sucursal está activa', required: false, default: true })
    @IsOptional()
    @IsBoolean({ message: 'El campo activa debe ser un booleano' })
    activa?: boolean;
}
