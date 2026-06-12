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
}
