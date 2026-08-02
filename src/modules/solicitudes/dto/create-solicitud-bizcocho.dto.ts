import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class CreateSolicitudBizcochoDto {
    @IsString()
    nombre: string;

    @IsString()
    apellido: string;

    @IsOptional()
    @IsString()
    correo?: string;

    @IsString()
    telefono: string;

    @IsOptional()
    @IsObject()
    configuracion?: Record<string, any>;

    @IsOptional()
    precioEstimado?: number;

    // imagenReferencia no viene en el body JSON si es multipart, se maneja aparte en el controller,
    // pero si se envía como string en algún momento lo definimos.
    @IsOptional()
    @IsString()
    imagenReferencia?: string;
}
