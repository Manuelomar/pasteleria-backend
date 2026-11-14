import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClonarCatalogoDto {
    @ApiProperty({ description: 'ID de la sucursal de donde se copiarán los productos', example: 'uuid-origen' })
    @IsString({ message: 'El ID de la sucursal origen debe ser texto' })
    @IsNotEmpty({ message: 'El ID de la sucursal origen es obligatorio' })
    sucursalOrigenId: string;

    @ApiProperty({ description: 'Si es true, copia las cantidades en stock; si es false, inicia en 0', required: false, default: false })
    @IsOptional()
    @IsBoolean({ message: 'clonarStock debe ser un valor booleano' })
    clonarStock?: boolean;
}

export class ClonarCatalogoResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    count: number;

    @ApiProperty()
    message: string;
}
