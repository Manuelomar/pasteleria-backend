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
    @Query('pagoPendiente') pagoPendiente: string,
    @Query('pagoPagado') pagoPagado: string,
    @Res() res: Response,
  ) {
    const isPagoPendiente = pagoPendiente === 'true';
    const isPagoPagado = pagoPagado === 'true';

    const html = await this.reportesService.generarReporteProveedor(
      fechaInicio,
      fechaFin,
      isPagoPendiente,
      isPagoPagado,
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('ventas')
  async getReporteVentas(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('metodosPago') metodosPagoStr: string,
    @Res() res: Response,
  ) {
    const metodosPago = metodosPagoStr ? metodosPagoStr.split(',') : undefined;

    const html = await this.reportesService.generarReporteVentas(
      fechaInicio,
      fechaFin,
      metodosPago,
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
  @Get('ganancias')
  async getReporteGanancias(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Res() res: Response,
  ) {
    const html = await this.reportesService.generarReporteGanancias(
      fechaInicio,
      fechaFin,
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
