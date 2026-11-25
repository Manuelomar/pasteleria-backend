import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { EntregasService, CreateEntregaDto, UpdateEntregaItemsDto } from './entregas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstadoEntrega, EstadoPagoEntrega } from '../../entities/entrega.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RequestWithUser } from '../../common/interfaces/auth-user.interface';

@Controller('entregas')
@UseGuards(JwtAuthGuard)
export class EntregasController {
    constructor(private readonly entregasService: EntregasService) {}

    @Post()
    create(@Body() createEntregaDto: CreateEntregaDto, @Request() req: RequestWithUser) {
        if (req.user?.role === 'proveedor') {
            createEntregaDto.proveedorId = req.user.id;
        }
        return this.entregasService.create(createEntregaDto, req.user);
    }

    @Get()
    findAll(
        @Request() req: RequestWithUser,
        @Query('filtro') filtro?: string,
        @Query('sucursalId') sucursalId?: string,
        @Query('proveedorId') proveedorId?: string,
    ) {
        return this.entregasService.findAll(req.user, filtro, sucursalId, proveedorId);
    }

    @Get('paged')
    findAllPaged(
        @Query() paginationDto: PaginationDto,
        @Request() req: RequestWithUser,
        @Query('filtro') filtro?: string,
        @Query('search') search?: string,
        @Query('proveedorId') proveedorId?: string,
        @Query('sucursalId') sucursalId?: string,
    ) {
        return this.entregasService.findAllPaged(paginationDto, req.user, filtro, search, proveedorId, sucursalId);
    }

    @Patch(':id/estado-entrega')
    updateEstadoEntrega(
        @Param('id') id: string,
        @Body('estado') estado: EstadoEntrega
    ) {
        return this.entregasService.updateEstadoEntrega(id, estado);
    }

    @Patch(':id/estado-pago')
    updateEstadoPago(
        @Param('id') id: string,
        @Body('estado') estado: EstadoPagoEntrega
    ) {
        return this.entregasService.updateEstadoPago(id, estado);
    }

    @Patch(':id/items')
    updateItems(
        @Param('id') id: string,
        @Body() updateItemsDto: UpdateEntregaItemsDto
    ) {
        return this.entregasService.updateItems(id, updateItemsDto);
    }

    @Post(':id/add-to-stock')
    addToStock(@Param('id') id: string) {
        return this.entregasService.addToStock(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.entregasService.remove(id);
    }
}
