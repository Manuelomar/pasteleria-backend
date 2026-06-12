import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional({ description: 'Número de página (por defecto: 1)', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El número de página debe ser un entero' })
    @Min(1, { message: 'El número de página debe ser al menos 1' })
    pageNumber?: number = 1;

    @ApiPropertyOptional({ description: 'Cantidad de elementos por página (por defecto: 10)', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El tamaño de página debe ser un entero' })
    @Min(1, { message: 'El tamaño de página debe ser al menos 1' })
    pageSize?: number = 10;
}

export class SaleTotalsDto {
    totalVentas: number;
    totalItbis: number;
    totalNeto: number;
    totalPendiente: number;
    totalCount: number;
    totalUnidades?: number;
    totalValor?: number;
}

export class PaginatedResponseDto<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    totals?: SaleTotalsDto;

    constructor(data: T[], total: number, page: number, pageSize: number, totals?: SaleTotalsDto) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = Math.ceil(total / pageSize);
        this.totals = totals;
    }
}
