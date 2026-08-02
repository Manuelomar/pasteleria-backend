import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, Not } from 'typeorm';
import { Producto } from '../../entities/producto.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repo: Repository<Producto>,
  ) {}

  findAll(user?: any) {
    const query = this.repo.createQueryBuilder('producto');
    if (user && user.role === 'proveedor') {
      query.where('producto.proveedorId = :proveedorId', { proveedorId: user.id });
    }
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
        queryBuilder.andWhere('producto.proveedorId IS NULL');
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
    return this.repo.save(entity);
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
