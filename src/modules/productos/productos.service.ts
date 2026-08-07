import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, Not } from 'typeorm';
import { Producto } from '../../entities/producto.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { GastosService } from '../gastos/gastos.service';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repo: Repository<Producto>,
    private readonly gastosService: GastosService
  ) {}

  findAll(user?: any, disponible?: boolean) {
    const query = this.repo.createQueryBuilder('producto');
    if (user && user.role === 'proveedor') {
      query.andWhere('producto.proveedorId = :proveedorId', { proveedorId: user.id });
    }
    if (disponible !== undefined) {
      query.andWhere('producto.disponible = :disponible', { disponible });
    }
    query.orderBy('producto.nombre', 'ASC');
    return query.getMany();
  }

  async findAllPaged(
    paginationDto: PaginationDto,
    search?: string,
    tipo?: string,
    disponible?: boolean,
    user?: any,
    proveedorId?: string
  ): Promise<PaginatedResponseDto<Producto>> {
    const pageVal = Number(paginationDto.pageNumber || 1);
    const sizeVal = Number(paginationDto.pageSize || 10);
    const skip = (pageVal - 1) * sizeVal;

    const queryBuilder = this.repo.createQueryBuilder('producto');

    if (user && user.role === 'proveedor') {
      queryBuilder.andWhere('producto.proveedorId = :proveedorId', { proveedorId: user.id });
    } else if (proveedorId) {
      if (proveedorId === 'internos') {
        queryBuilder.andWhere('(producto.proveedorId IS NULL OR producto.proveedorId = :interno)', { interno: 'internos' });
      } else {
        queryBuilder.andWhere('producto.proveedorId = :proveedorId', { proveedorId });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(producto.nombre) LIKE LOWER(:search) OR LOWER(producto.categoria) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (tipo && tipo !== 'todos') {
      if (tipo === 'productos') {
        queryBuilder.andWhere("producto.tipo != 'material'");
      } else if (tipo === 'materiales') {
        queryBuilder.andWhere("producto.tipo = 'material'");
      } else {
        queryBuilder.andWhere('producto.tipo = :tipo', { tipo });
      }
    }

    if (disponible !== undefined) {
      queryBuilder.andWhere('producto.disponible = :disponible', { disponible });
    }

    queryBuilder.orderBy('producto.nombre', 'ASC');
    queryBuilder.skip(skip);
    queryBuilder.take(sizeVal);

    const [productos, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(productos, total, pageVal, sizeVal);
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Producto>) {
    if (data.nombre) {
      const existing = await this.repo.findOne({ 
        where: { 
          nombre: ILike(data.nombre),
          proveedorId: data.proveedorId || IsNull()
        } 
      });
      if (existing) {
        throw new BadRequestException("Ya existe un producto con este nombre en tu catálogo. Utiliza la opción de 'Añadir producto existente' si deseas agregarlo con el mismo nombre.");
      }
    }
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);

    if (saved.cantidad > 0 && saved.precioCosto > 0) {
      const costoTotal = Number(saved.precioCosto) * saved.cantidad;
      await this.gastosService.create({
        descripcion: `Compra de stock inicial: ${saved.nombre} (${saved.cantidad} unds)`,
        monto: costoTotal,
        productoId: saved.id,
      });
    }

    return saved;
  }

  async update(id: string, data: Partial<Producto>) {
    if (data.nombre) {
      const current = await this.findOne(id);
      if (current && current.nombre !== data.nombre) {
        const existing = await this.repo.findOne({ 
          where: { 
            nombre: ILike(data.nombre),
            proveedorId: current.proveedorId || IsNull(),
            id: Not(id)
          } 
        });
        if (existing) {
          throw new BadRequestException("Ya existe un producto con este nombre en tu catálogo.");
        }
      }
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async addStock(id: string, cantidadAñadida: number) {
    const producto = await this.findOne(id);
    if (!producto) throw new BadRequestException('Producto no encontrado');

    const newCantidad = (producto.cantidad ?? 0) + cantidadAñadida;
    const newDisponible = newCantidad > 0 ? true : producto.disponible;

    const costoTotal = (Number(producto.precioCosto) || 0) * cantidadAñadida;
    if (costoTotal > 0) {
      await this.gastosService.create({
        descripcion: `Compra de stock: ${producto.nombre} (${cantidadAñadida} unds)`,
        monto: costoTotal,
        productoId: producto.id,
      });
    }

    await this.repo.update(id, { cantidad: newCantidad, disponible: newDisponible });
    return this.findOne(id);
  }

  async revertStock(id: string, cantidadRevertida: number) {
    const producto = await this.findOne(id);
    if (!producto) throw new BadRequestException('Producto no encontrado');

    const newCantidad = Math.max(0, (producto.cantidad ?? 0) - cantidadRevertida);
    const newDisponible = newCantidad > 0 ? true : producto.disponible;

    const costoTotal = (Number(producto.precioCosto) || 0) * cantidadRevertida;
    if (costoTotal > 0) {
      await this.gastosService.create({
        descripcion: `Corrección de stock (Reverso): ${producto.nombre} (-${cantidadRevertida} unds)`,
        monto: -costoTotal, // Negative expense acts as a refund
        productoId: producto.id,
      });
    }

    await this.repo.update(id, { cantidad: newCantidad, disponible: newDisponible });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async getUniqueNames(): Promise<Partial<Producto>[]> {
    const query = this.repo.createQueryBuilder('producto')
      .where('producto.disponible = :disponible', { disponible: true })
      .select('DISTINCT(LOWER(producto.nombre))', 'lowerNombre')
      .addSelect('MAX(producto.nombre)', 'nombre')
      .addSelect('MAX(producto.categoria)', 'categoria')
      .addSelect('MAX(producto.tipo)', 'tipo')
      .addSelect('MAX(producto.imagen)', 'imagen')
      .addSelect('MAX(producto.descripcion)', 'descripcion')
      .addSelect('MAX(producto.precioCosto)', 'precioCosto')
      .addSelect('MAX(producto.precio)', 'precio')
      .addSelect('MAX(producto.precioUber)', 'precioUber')
      .groupBy('LOWER(producto.nombre)')
      .orderBy('LOWER(producto.nombre)', 'ASC');

    const result = await query.getRawMany();
    return result.map(row => ({
      nombre: row.nombre,
      categoria: row.categoria,
      tipo: row.tipo,
      imagen: row.imagen,
      descripcion: row.descripcion,
      precioCosto: Number(row.precioCosto) || 0,
      precio: Number(row.precio) || 0,
      precioUber: Number(row.precioUber) || 0
    }));
  }
}
