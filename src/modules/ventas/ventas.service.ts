import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Venta } from '../../entities/venta.entity';
import { Producto } from '../../entities/producto.entity';
import { VentaItem } from '../../entities/venta-item.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly repo: Repository<Venta>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(VentaItem)
    private readonly ventaItemRepo: Repository<VentaItem>,
  ) {}

  findAll() {
    return this.repo.find({ order: { fecha: 'DESC' } });
  }

  async findAllPaged(paginationDto: PaginationDto, fecha?: string): Promise<PaginatedResponseDto<Venta>> {
    const { pageNumber = 1, pageSize = 10 } = paginationDto;
    const skip = (pageNumber - 1) * pageSize;

    const query = this.repo.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.items', 'items')
      .orderBy('venta.fecha', 'DESC');

    if (fecha) {
      // Asume formato YYYY-MM-DD
      query.andWhere('DATE(venta.fecha) = :fecha', { fecha });
    }

    const [data, total] = await query.skip(skip).take(pageSize).getManyAndCount();

    return new PaginatedResponseDto<Venta>(data, total, pageNumber, pageSize);
  }

  async getResumenCaja(fecha: string) {
    const query = this.repo.createQueryBuilder('venta')
      .select('venta.metodoPago', 'metodoPago')
      .addSelect('SUM(venta.total)', 'total')
      .addSelect('COUNT(venta.id)', 'cantidad')
      .where('DATE(venta.fecha) = :fecha', { fecha })
      .groupBy('venta.metodoPago');

    const result = await query.getRawMany();
    
    let efectivo = 0;
    let tarjeta = 0;
    let transferencia = 0;
    let totalGeneral = 0;
    let cantidadGeneral = 0;

    result.forEach(row => {
      const totalNum = Number(row.total);
      const countNum = Number(row.cantidad);
      if (row.metodoPago === 'efectivo') efectivo += totalNum;
      if (row.metodoPago === 'tarjeta') tarjeta += totalNum;
      if (row.metodoPago === 'transferencia') transferencia += totalNum;
      totalGeneral += totalNum;
      cantidadGeneral += countNum;
    });

    return {
      efectivo,
      tarjeta,
      transferencia,
      total: totalGeneral,
      cantidad: cantidadGeneral,
    };
  }

  async getReporteHistorico() {
    const result = await this.repo.createQueryBuilder('venta')
      .select('SUM(venta.total)', 'total')
      .addSelect('COUNT(venta.id)', 'cantidad')
      .getRawOne();

    return {
      total: Number(result?.total || 0),
      cantidad: Number(result?.cantidad || 0),
    };
  }

  async getTopProductos(paginationDto: PaginationDto) {
    const { pageNumber = 1, pageSize = 10 } = paginationDto;
    const skip = (pageNumber - 1) * pageSize;

    // We query venta_items, group by nombre and productoId, sum cantidad and price
    const query = this.ventaItemRepo.createQueryBuilder('item')
      .select('item.nombre', 'nombre')
      .addSelect('item.productoId', 'productoId')
      .addSelect('SUM(item.cantidad)', 'cantidad')
      .addSelect('SUM(item.cantidad * item.precio)', 'total')
      .groupBy('item.nombre')
      .addGroupBy('item.productoId')
      .orderBy('SUM(item.cantidad)', 'DESC');

    // To get total count of unique products sold
    const countQuery = this.ventaItemRepo.createQueryBuilder('item')
      .select('COUNT(DISTINCT item.nombre)', 'count');
    const countResult = await countQuery.getRawOne();
    const total = Number(countResult?.count || 0);

    const dataRaw = await query.offset(skip).limit(pageSize).getRawMany();
    
    const data = dataRaw.map(r => ({
      nombre: r.nombre,
      productoId: r.productoId,
      cantidad: Number(r.cantidad || 0),
      total: Number(r.total || 0),
    }));

    return {
      data,
      total,
      page: pageNumber,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Venta>) {
    if (!data.factura) {
      data.factura = `FAC-${Date.now()}`;
    }
    if (!data.fecha) {
      data.fecha = new Date();
    }
    const entity = this.repo.create(data);
    const savedVenta = await this.repo.save(entity);

    // Descontar inventario
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.productoId) {
          const producto = await this.productoRepo.findOne({ where: { id: item.productoId } });
          if (producto) {
            producto.cantidad = Math.max(0, (producto.cantidad || 0) - item.cantidad);
            producto.vendidos = (producto.vendidos || 0) + item.cantidad;
            if (producto.cantidad === 0) {
              producto.disponible = false;
            }
            await this.productoRepo.save(producto);
          }
        }
      }
    }

    return savedVenta;
  }

  async update(id: string, data: Partial<Venta>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async getInvoiceHtml(id: string): Promise<string> {
    const venta = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'items'],
    });
    
    if (!venta) {
      return `<html><body><h1>Venta no encontrada</h1></body></html>`;
    }
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${venta.factura}</title>
  <style>
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 280px;
      margin: 0 auto;
      padding: 10px;
      color: #000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .header { margin-bottom: 15px; }
    .header h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
    .info { margin-bottom: 10px; }
    .separator { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    table th, table td { font-size: 12px; padding: 2px 0; }
    .totals { margin-top: 10px; }
    .totals table td { padding: 1px 0; }
    .footer { margin-top: 20px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header text-center">
    <h1>Pastelería Bizcochao</h1>
    <p>RNC: 01800426387<br>Av. Sanvicente de Paul, Santo Domingo, RD<br>Tel: (809) 433-3384</p>
  </div>
  
  <div class="info">
    <div><b>Factura:</b> ${venta.factura}</div>
    <div><b>Fecha:</b> ${new Date(venta.fecha).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}</div>
    <div><b>Cliente:</b> ${venta.cliente?.nombre || venta.clienteNombre || 'Consumidor Final'}</div>
  </div>
  
  <div class="separator"></div>
  
  <table>
    <thead>
      <tr>
        <th class="text-left">Cant x Prod</th>
        <th class="text-right">Precio</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${venta.items.map(item => `
        <tr>
          <td>${item.cantidad} x ${item.nombre}</td>
          <td class="text-right">${Number(item.precio).toFixed(2)}</td>
          <td class="text-right">${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="separator"></div>
  
  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${Number(venta.subtotal).toFixed(2)}</td>
      </tr>
      ${Number(venta.descuento) > 0 ? `
      <tr>
        <td>Descuento:</td>
        <td class="text-right">-${Number(venta.descuento).toFixed(2)}</td>
      </tr>` : ''}
      <tr>
        <td>ITBIS (18%):</td>
        <td class="text-right">${Number(venta.impuesto).toFixed(2)}</td>
      </tr>
      <tr class="font-bold">
        <td>Total:</td>
        <td class="text-right">RD$ ${Number(venta.total).toFixed(2)}</td>
      </tr>
      <tr class="separator-row"><td colspan="2"><div class="separator"></div></td></tr>
      <tr>
        <td>Método Pago:</td>
        <td class="text-right">${venta.metodoPago.toUpperCase()}</td>
      </tr>
      <tr>
        <td>Estado Pago:</td>
        <td class="text-right">${venta.estadoPago.toUpperCase()}</td>
      </tr>
      <tr>
        <td>Monto Recibido:</td>
        <td class="text-right">${Number(venta.montoPagado).toFixed(2)}</td>
      </tr>
      ${Number(venta.balance) > 0 ? `
      <tr class="font-bold">
        <td>Balance Pendiente:</td>
        <td class="text-right">RD$ ${Number(venta.balance).toFixed(2)}</td>
      </tr>` : ''}
    </table>
  </div>
  
  <div class="footer text-center">
    <p>¡Gracias por su compra!<br>Favor conservar su factura.<br>Dulce o Salado, siempre el mejor sabor.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() {
        window.close();
      }, 1000);
    };
  </script>
</body>
</html>`;
  }
}
