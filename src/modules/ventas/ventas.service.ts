import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, MoreThanOrEqual } from 'typeorm';
import { Venta } from '../../entities/venta.entity';
import { Producto } from '../../entities/producto.entity';
import { VentaItem } from '../../entities/venta-item.entity';
import { Cliente } from '../../entities/cliente.entity';
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
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  findAll() {
    return this.repo.find({ order: { fecha: 'DESC' } });
  }

  getPendientes() {
    return this.repo.find({
      where: [
        { estadoPago: 'pendiente' },
        { estadoPago: 'parcial' }
      ],
      relations: ['cliente', 'items'],
      order: { fecha: 'ASC' },
    });
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

  async getHistorialProductos(desde?: string, hasta?: string, productoId?: string, pageNumber: number = 1, pageSize: number = 10) {
    const skip = (pageNumber - 1) * pageSize;

    const query = this.ventaItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.venta', 'venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .orderBy('venta.fecha', 'DESC');

    if (desde) {
      query.andWhere('DATE(venta.fecha) >= :desde', { desde });
    }
    if (hasta) {
      query.andWhere('DATE(venta.fecha) <= :hasta', { hasta });
    }
    if (productoId && productoId !== 'all' && productoId !== '') {
      query.andWhere('item.productoId = :productoId', { productoId });
    }

    const [items, total] = await query.skip(skip).take(pageSize).getManyAndCount();

    // Get overall totals for the filtered data without pagination
    const totalsQuery = this.ventaItemRepo.createQueryBuilder('item')
      .leftJoin('item.venta', 'venta');

    if (desde) {
      totalsQuery.andWhere('DATE(venta.fecha) >= :desde', { desde });
    }
    if (hasta) {
      totalsQuery.andWhere('DATE(venta.fecha) <= :hasta', { hasta });
    }
    if (productoId && productoId !== 'all' && productoId !== '') {
      totalsQuery.andWhere('item.productoId = :productoId', { productoId });
    }
    
    totalsQuery.select('SUM(item.cantidad)', 'overallCantidad')
               .addSelect('SUM(item.cantidad * item.precio)', 'overallTotal')
               .addSelect('SUM(item.cantidad * (item.precio - COALESCE(item.precioCosto, 0)))', 'overallGanancia');
               
    const totalsResult = await totalsQuery.getRawOne();

    const data = items.map(item => {
      let nombreCliente = item.venta?.cliente?.nombre || item.venta?.clienteNombre || 'Consumidor Final';
      if (item.venta?.metodoPago === 'uberEats') {
        nombreCliente = `UberEats - ${nombreCliente === 'Consumidor Final' ? 'Cliente' : nombreCliente}`;
      }

      return {
        id: item.id,
        fecha: item.venta?.fecha,
        factura: item.venta?.factura,
        clienteNombre: nombreCliente,
        producto: item.nombre,
        productoId: item.productoId,
        cantidad: Number(item.cantidad),
        precio: Number(item.precio),
        total: Number(item.cantidad) * Number(item.precio),
      };
    });

    return {
      data,
      total,
      page: pageNumber,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      overallCantidad: Number(totalsResult?.overallCantidad || 0),
      overallTotal: Number(totalsResult?.overallTotal || 0),
      overallGanancia: Number(totalsResult?.overallGanancia || 0),
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
    
    // Poblar precioCosto antes de guardar
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.productoId) {
          const producto = await this.productoRepo.findOne({ where: { id: item.productoId } });
          if (producto) {
            item.precioCosto = Number(producto.precioCosto || 0);
          } else {
            item.precioCosto = 0;
          }
        } else {
          item.precioCosto = 0;
        }
      }
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

  async getDashboardMetrics(fechaInicio?: string, fechaFin?: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const startOfYear = new Date(currentYear, 0, 1);

    // Fetch necessary data
    // To optimize, we fetch sales for the current year OR up to startOfWeek if the year just started
    const minDate = startOfWeek < startOfYear ? startOfWeek : startOfYear;
    
    let queryOptions: any = {
      where: { fecha: MoreThanOrEqual(minDate) },
      relations: ['items'],
      order: { fecha: 'DESC' }
    };
    
    // Fetch base sales for default metrics
    let ventasBase = await this.repo.find(queryOptions);
    
    // Fetch custom sales if requested and they fall outside our base range
    let ventasCustom = [];
    let customStart: Date, customEnd: Date;
    if (fechaInicio && fechaFin) {
       customStart = new Date(fechaInicio);
       customStart.setHours(0, 0, 0, 0);
       customEnd = new Date(fechaFin);
       customEnd.setHours(23, 59, 59, 999);
       
       if (customStart < minDate) {
           ventasCustom = await this.repo.find({
               where: { fecha: Between(customStart, customEnd) },
               relations: ['items']
           });
       }
    }
    
    const allVentasConsidered = [...ventasBase];
    ventasCustom.forEach(vc => {
        if (!allVentasConsidered.find(v => v.id === vc.id)) {
            allVentasConsidered.push(vc);
        }
    });

    const productos = await this.productoRepo.find();
    
    const createEmptyStats = () => ({ ventas: 0, ganancia: 0, itbis: 0, sinItbis: 0, ordenes: 0 });
    const hoy = createEmptyStats();
    const semana = createEmptyStats();
    const mes = createEmptyStats();
    const anio = createEmptyStats();
    const custom = createEmptyStats();

    allVentasConsidered.forEach(v => {
      const date = new Date(v.fecha);
      const isHoy = date >= startOfDay && date <= today;
      const isSemana = date >= startOfWeek && date <= today;
      const isMes = date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      const isAnio = date.getFullYear() === currentYear;

      let ventaCosto = 0;
      if (v.items) {
          v.items.forEach(item => {
            ventaCosto += (Number(item.precioCosto) || 0) * Number(item.cantidad);
          });
      }
      
      const sub = Number(v.subtotal) || 0;
      const imp = Number(v.impuesto) || 0;
      const desc = Number(v.descuento) || 0;
      const ingresoVenta = sub - desc;
      const ganancia = ingresoVenta - ventaCosto;
      const vTotal = Number(v.total) || 0;

      if (isHoy) {
        hoy.ventas += vTotal;
        hoy.ganancia += ganancia;
        hoy.itbis += imp;
        hoy.sinItbis += sub;
        hoy.ordenes += 1;
      }
      if (isSemana) {
        semana.ventas += vTotal;
        semana.ganancia += ganancia;
        semana.itbis += imp;
        semana.sinItbis += sub;
        semana.ordenes += 1;
      }
      if (isMes) {
        mes.ventas += vTotal;
        mes.ganancia += ganancia;
        mes.itbis += imp;
        mes.sinItbis += sub;
        mes.ordenes += 1;
      }
      if (isAnio) {
        anio.ventas += vTotal;
        anio.ganancia += ganancia;
        anio.itbis += imp;
        anio.sinItbis += sub;
        anio.ordenes += 1;
      }

      if (customStart && customEnd) {
        if (date >= customStart && date <= customEnd) {
          custom.ventas += vTotal;
          custom.ganancia += ganancia;
          custom.itbis += imp;
          custom.sinItbis += sub;
          custom.ordenes += 1;
        }
      }
    });

    const stats = { hoy, semana, mes, anio, custom };

    // Ventas Semanales
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const ventasSemanales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const sum = allVentasConsidered
        .filter(v => new Date(v.fecha).toISOString().split("T")[0] === dateStr)
        .reduce((s, v) => s + (Number(v.total) || 0), 0);
      ventasSemanales.push({ dia: days[d.getDay()], ventas: sum });
    }

    // Ventas Mensuales
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const ventasMensuales = months.map(mes => ({ mes, ventas: 0, subtotal: 0, impuesto: 0 }));
    
    allVentasConsidered.forEach(v => {
      const date = new Date(v.fecha);
      if (date.getFullYear() === currentYear) {
        ventasMensuales[date.getMonth()].ventas += (Number(v.total) || 0);
        ventasMensuales[date.getMonth()].subtotal += (Number(v.subtotal) || 0);
        ventasMensuales[date.getMonth()].impuesto += (Number(v.impuesto) || 0);
      }
    });

    // Categorias
    const colorsCat: Record<string, string> = {
      Dulce: "var(--color-chart-1)",
      Salado: "var(--color-chart-2)",
      Bebida: "var(--color-chart-3)",
    };
    const catMap: Record<string, number> = { Dulce: 0, Salado: 0, Bebida: 0 };
    allVentasConsidered.forEach(v => {
      if (v.items) {
          v.items.forEach(item => {
            const prod = productos.find(p => p.id === item.productoId);
            if (prod) {
              const cat = prod.tipo === "dulce" ? "Dulce" : prod.tipo === "salado" ? "Salado" : "Bebida";
              catMap[cat] += Number(item.precio) * Number(item.cantidad);
            }
          });
      }
    });
    const ventasPorCategoria = Object.keys(catMap).map(k => ({
      categoria: k,
      valor: catMap[k],
      fill: colorsCat[k] || "var(--color-chart-1)"
    })).filter(x => x.valor > 0);

    // Metodos Pago
    const colorsMet: Record<string, string> = {
      Efectivo: "var(--color-chart-1)",
      Tarjeta: "var(--color-chart-2)",
      Transferencia: "var(--color-chart-3)",
      UberEats: "var(--color-chart-4)",
    };
    const mapMet: Record<string, number> = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, UberEats: 0 };
    
    allVentasConsidered.forEach(v => {
      const met = v.metodoPago === "efectivo" ? "Efectivo" : 
                  v.metodoPago === "tarjeta" ? "Tarjeta" : 
                  v.metodoPago === "uberEats" ? "UberEats" : "Transferencia";
      mapMet[met] += (Number(v.total) || 0);
    });
    const metodosPago = Object.keys(mapMet).map(k => ({
      metodo: k,
      valor: mapMet[k],
      fill: colorsMet[k] || "var(--color-chart-1)"
    })).filter(x => x.valor > 0);

    const masVendidos = [...productos].sort((a, b) => Number(b.vendidos) - Number(a.vendidos)).slice(0, 5);
    const productosDisp = productos.filter((p) => p.disponible).length;
    
    // Por Cobrar
    const pendientes = await this.repo.find({
      where: [
        { estadoPago: 'pendiente' },
        { estadoPago: 'parcial' }
      ]
    });
    const porCobrar = pendientes.reduce((s, v) => s + Number(v.balance || 0), 0);

    // Ultimas ventas
    const ventasRecientes = await this.repo.find({
        order: { fecha: 'DESC' },
        take: 5,
        relations: ['cliente', 'items']
    });

    return {
        stats,
        ventasSemanales,
        ventasMensuales,
        ventasPorCategoria,
        metodosPago,
        masVendidos,
        productosDisp,
        porCobrar,
        ventasRecientes
    };
  }

  async getInvoiceHtml(id: string): Promise<string> {
    const venta = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'items', 'items.producto'],
    });
    
    if (!venta) {
      return `<html><body><h1>Venta no encontrada</h1></body></html>`;
    }
    const formatCurrency = (n: number) => 'RD$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${venta.factura}</title>
  <style>
    @page {
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 5mm;
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
    <div><b>Fecha:</b> ${
      (() => {
        const d = new Date(venta.updatedAt || venta.fecha);
        return d.toLocaleString('es-DO', { 
          timeZone: 'America/Santo_Domingo', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }).replace(',', '');
      })()
    }</div>
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
      ${venta.items.map(item => {
        let displayPrice = Number(item.precio);
        if (venta.metodoPago === 'uberEats' && item.producto && item.producto.precioUber) {
          displayPrice = Number(item.producto.precioUber);
        }
        return `
        <tr>
          <td>${item.cantidad} x ${item.nombre}</td>
          <td class="text-right">${formatCurrency(displayPrice)}</td>
          <td class="text-right">${formatCurrency(item.cantidad * displayPrice)}</td>
        </tr>
        `
      }).join('')}
    </tbody>
  </table>
  
  <div class="separator"></div>
  
  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${formatCurrency(
          venta.metodoPago === 'uberEats'
          ? venta.items.reduce((s, i) => s + (i.cantidad * (i.producto?.precioUber || Number(i.precio))), 0)
          : Number(venta.subtotal)
        )}</td>
      </tr>
      ${Number(venta.descuento) > 0 ? `
      <tr>
        <td>Descuento:</td>
        <td class="text-right">-${formatCurrency(Number(venta.descuento))}</td>
      </tr>` : ''}
      <tr>
        <td>ITBIS (18%):</td>
        <td class="text-right">${formatCurrency(Number(venta.impuesto))}</td>
      </tr>
      <tr class="font-bold">
        <td>Total:</td>
        <td class="text-right">${formatCurrency(
          venta.metodoPago === 'uberEats'
          ? venta.items.reduce((s, i) => s + (i.cantidad * (i.producto?.precioUber || Number(i.precio))), 0) - Number(venta.descuento) + Number(venta.impuesto)
          : Number(venta.total)
        )}</td>
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
        <td class="text-right">${formatCurrency(Number(venta.montoPagado))}</td>
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
</body>
</html>`;
  }
}

