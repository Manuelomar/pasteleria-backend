import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../entities/entrega.entity';
import * as ejs from 'ejs';
import { reporteProveedorTemplate } from './reportes.template';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Entrega)
    private entregaRepository: Repository<Entrega>,
  ) {}

  async generarReporteProveedor(
    fechaInicio?: string,
    fechaFin?: string,
    entregado?: boolean,
    noPagado?: boolean,
    finalizado?: boolean,
  ): Promise<string> {
    const qb = this.entregaRepository.createQueryBuilder('entrega')
      .leftJoinAndSelect('entrega.proveedor', 'proveedor')
      .leftJoinAndSelect('entrega.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto');

    if (fechaInicio) {
      qb.andWhere('entrega.createdAt >= :fechaInicio', { fechaInicio: new Date(fechaInicio) });
    }
    if (fechaFin) {
      const dateFin = new Date(fechaFin);
      dateFin.setHours(23, 59, 59, 999);
      qb.andWhere('entrega.createdAt <= :fechaFin', { fechaFin: dateFin });
    }

    const statusConditions = [];
    if (entregado) {
      statusConditions.push(`entrega.estadoEntrega = 'entregada'`);
    }
    if (noPagado) {
      statusConditions.push(`entrega.estadoPago = 'pendiente_pago'`);
    }
    if (finalizado) {
      statusConditions.push(`(entrega.estadoEntrega = 'entregada' AND entrega.estadoPago = 'pagado')`);
    }

    if (statusConditions.length > 0) {
      qb.andWhere(`(${statusConditions.join(' OR ')})`);
    }

    qb.orderBy('entrega.createdAt', 'DESC');

    const entregas = await qb.getMany();

    const html = ejs.render(reporteProveedorTemplate, {
      entregas,
      filtros: { fechaInicio, fechaFin, entregado, noPagado, finalizado }
    });

    return html;
  }
}
