import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('proveedor')
  async getReporteProveedor(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('entregado') entregado: string,
    @Query('noPagado') noPagado: string,
    @Query('finalizado') finalizado: string,
    @Res() res: Response,
  ) {
    const isEntregado = entregado === 'true';
    const isNoPagado = noPagado === 'true';
    const isFinalizado = finalizado === 'true';

    const html = await this.reportesService.generarReporteProveedor(
      fechaInicio,
      fechaFin,
      isEntregado,
      isNoPagado,
      isFinalizado,
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
