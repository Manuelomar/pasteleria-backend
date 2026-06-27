import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { EntregasService, CreateEntregaDto } from './entregas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstadoEntrega, EstadoPagoEntrega } from '../../entities/entrega.entity';

@Controller('entregas')
@UseGuards(JwtAuthGuard)
export class EntregasController {
    constructor(private readonly entregasService: EntregasService) {}

    @Post()
    create(@Body() createEntregaDto: CreateEntregaDto, @Request() req) {
        if (req.user.role === 'proveedor') {
            createEntregaDto.proveedorId = req.user.id;
        }
        return this.entregasService.create(createEntregaDto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.entregasService.findAll(req.user);
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
}
