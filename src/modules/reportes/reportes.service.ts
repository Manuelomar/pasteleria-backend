import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../entities/entrega.entity';
import { Venta } from '../../entities/venta.entity';
import * as ejs from 'ejs';
import { reporteProveedorTemplate, reporteVentasTemplate, reporteGananciasTemplate } from './reportes.template';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Entrega)
    private entregaRepository: Repository<Entrega>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
  ) {}

  async generarReporteProveedor(
    fechaInicio?: string,
    fechaFin?: string,
    pagoPendiente?: boolean,
    pagoPagado?: boolean,
    proveedorId?: string,
  ): Promise<string> {
    const qb = this.entregaRepository.createQueryBuilder('entrega')
      .leftJoinAndSelect('entrega.proveedor', 'proveedor')
      .leftJoinAndSelect('entrega.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto');

    if (proveedorId) {
      qb.andWhere('proveedor.id = :proveedorId', { proveedorId });
    }

    if (fechaInicio) {
      qb.andWhere('entrega.createdAt >= :fechaInicio', { fechaInicio: new Date(fechaInicio + 'T00:00:00') });
    }
    if (fechaFin) {
      const dateFin = new Date(fechaFin + 'T23:59:59.999');
      qb.andWhere('entrega.createdAt <= :fechaFin', { fechaFin: dateFin });
    }

    // Excluir entregas en espera (pendiente de entrega)
    qb.andWhere("entrega.estadoEntrega != 'en_espera'");

    const statusConditions = [];
    if (pagoPendiente) {
      statusConditions.push(`entrega.estadoPago = 'pendiente_pago'`);
    }
    if (pagoPagado) {
      statusConditions.push(`entrega.estadoPago = 'pagado'`);
    }

    if (statusConditions.length > 0) {
      qb.andWhere(`(${statusConditions.join(' OR ')})`);
    }

    qb.orderBy('entrega.createdAt', 'DESC');

    const entregas = await qb.getMany();

    const html = ejs.render(reporteProveedorTemplate, {
      entregas,
      filtros: { fechaInicio, fechaFin, pagoPendiente, pagoPagado }
    });

    return html;
  }

  async generarReporteVentas(
    fechaInicio?: string,
    fechaFin?: string,
    metodosPago?: string[],
  ): Promise<string> {
    const qb = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .leftJoinAndSelect('venta.cliente', 'cliente');

    if (fechaInicio) {
      qb.andWhere('venta.fecha >= :fechaInicio', { fechaInicio: new Date(fechaInicio + 'T00:00:00') });
    }
    if (fechaFin) {
      const dateFin = new Date(fechaFin + 'T23:59:59.999');
      qb.andWhere('venta.fecha <= :fechaFin', { fechaFin: dateFin });
    }

    if (metodosPago && metodosPago.length > 0) {
      qb.andWhere('venta.metodoPago IN (:...metodosPago)', { metodosPago });
    }

    qb.orderBy('venta.createdAt', 'DESC');

    let ventas = await qb.getMany();

    // Ajustar para contabilidad de caja igual que en el Dashboard
    ventas = ventas.filter(v => v.estadoPago !== 'pendiente');
    ventas.forEach(v => {
      if (v.estadoPago === 'parcial') {
        const ratio = (Number(v.total) || 1) > 0 ? (Number(v.montoPagado) || 0) / (Number(v.total) || 1) : 0;
        v.subtotal = (Number(v.subtotal) || 0) * ratio as any;
        v.impuesto = (Number(v.impuesto) || 0) * ratio as any;
        v.descuento = (Number(v.descuento) || 0) * ratio as any;
        v.total = (Number(v.total) || 0) * ratio as any;
        if (v.items) {
          v.items.forEach(item => {
            item.cantidad = (Number(item.cantidad) || 0) * ratio as any;
          });
        }
      }
    });

    const html = ejs.render(reporteVentasTemplate, {
      ventas,
      filtros: { fechaInicio, fechaFin, metodosPago }
    });

    return html;
  }
  async generarReporteGanancias(
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<string> {
    const qb = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto');

    if (fechaInicio) {
      qb.andWhere('venta.fecha >= :fechaInicio', { fechaInicio: new Date(fechaInicio + 'T00:00:00') });
    }
    if (fechaFin) {
      const dateFin = new Date(fechaFin + 'T23:59:59.999');
      qb.andWhere('venta.fecha <= :fechaFin', { fechaFin: dateFin });
    }

    qb.orderBy('venta.createdAt', 'DESC');

    let ventas = await qb.getMany();

    // Ajustar para contabilidad de caja igual que en el Dashboard
    ventas = ventas.filter(v => v.estadoPago !== 'pendiente');
    ventas.forEach(v => {
      if (v.estadoPago === 'parcial') {
        const ratio = (Number(v.total) || 1) > 0 ? (Number(v.montoPagado) || 0) / (Number(v.total) || 1) : 0;
        v.subtotal = (Number(v.subtotal) || 0) * ratio as any;
        v.impuesto = (Number(v.impuesto) || 0) * ratio as any;
        v.descuento = (Number(v.descuento) || 0) * ratio as any;
        v.total = (Number(v.total) || 0) * ratio as any;
        if (v.items) {
          v.items.forEach(item => {
            item.cantidad = (Number(item.cantidad) || 0) * ratio as any;
          });
        }
      }
    });

    const html = ejs.render(reporteGananciasTemplate, {
      ventas,
      filtros: { fechaInicio, fechaFin }
    });

    return html;
  }
}

