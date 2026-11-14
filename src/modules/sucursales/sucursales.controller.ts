import { Controller, Get, Post, Put, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { Sucursal } from '../../entities/sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { ClonarCatalogoDto, ClonarCatalogoResponseDto } from './dto/clonar-catalogo.dto';

@ApiTags('Sucursales')
@ApiBearerAuth()
@Controller('sucursales')
export class SucursalesController {
    constructor(private readonly sucursalesService: SucursalesService) {}

    @Get()
    @ApiOperation({ summary: 'Listar sucursales' })
    @ApiResponse({ status: 200, type: [Sucursal] })
    findAll(@Query('includeInactivas') includeInactivas?: string): Promise<Sucursal[]> {
        const withInactivas = includeInactivas === 'true';
        return this.sucursalesService.findAll(withInactivas);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener sucursal por ID' })
    @ApiResponse({ status: 200, type: Sucursal })
    findById(@Param('id') id: string): Promise<Sucursal> {
        return this.sucursalesService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Crear nueva sucursal' })
    @ApiResponse({ status: 201, type: Sucursal })
    create(@Body() dto: CreateSucursalDto): Promise<Sucursal> {
        return this.sucursalesService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar sucursal' })
    @ApiResponse({ status: 200, type: Sucursal })
    update(@Param('id') id: string, @Body() dto: UpdateSucursalDto): Promise<Sucursal> {
        return this.sucursalesService.update(id, dto);
    }

    @Patch(':id/toggle-activa')
    @ApiOperation({ summary: 'Activar o desactivar sucursal' })
    @ApiResponse({ status: 200, type: Sucursal })
    toggleActiva(@Param('id') id: string): Promise<Sucursal> {
        return this.sucursalesService.toggleActiva(id);
    }

    @Post(':id/clonar-catalogo')
    @ApiOperation({ summary: 'Clonar catálogo de productos desde otra sucursal' })
    @ApiResponse({ status: 200, type: ClonarCatalogoResponseDto })
    clonarCatalogo(
        @Param('id') id: string,
        @Body() dto: ClonarCatalogoDto,
    ): Promise<ClonarCatalogoResponseDto> {
        return this.sucursalesService.clonarCatalogo(id, dto);
    }
}
