import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VentasService } from './ventas.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Response } from 'express';
import { Public } from '../../decorators/public.decorator';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly service: VentasService) {}

  @Public()
  @Get(':id/print')
  async printInvoice(@Param('id') id: string, @Res() res: Response) {
    const html = await this.service.getInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('paged')
  findAllPaged(
    @Query() paginationDto: PaginationDto,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.findAllPaged(paginationDto, fecha);
  }

  @Get('resumen-caja')
  getResumenCaja(@Query('fecha') fecha: string) {
    return this.service.getResumenCaja(fecha);
  }

  @Get('reporte-historico')
  getReporteHistorico() {
    return this.service.getReporteHistorico();
  }

  @Get('top-productos')
  getTopProductos(@Query() paginationDto: PaginationDto) {
    return this.service.getTopProductos(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
