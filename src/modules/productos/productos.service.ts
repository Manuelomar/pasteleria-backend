import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, Not } from 'typeorm';
import { Producto } from '../../entities/producto.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repo: Repository<Producto>,
  ) {}

  findAll(user?: AuthUser | null, disponible?: boolean, sucursalId?: string): Promise<Producto[]> {
    const query = this.repo.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.sucursal', 'sucursal');

    if (user && user.role === 'proveedor') {
      query.andWhere('producto.proveedorId = :proveedorId', { proveedorId: user.id });
    }

    // Filtrado por sucursal
    if (user && user.role === 'superadmin') {
      if (sucursalId && sucursalId !== 'todas') {
        query.andWhere('producto.sucursalId = :sucursalId', { sucursalId });
      }
    } else if (user?.sucursalId) {
      query.andWhere('producto.sucursalId = :sucursalId', { sucursalId: user.sucursalId });
    } else if (sucursalId && sucursalId !== 'todas') {
      query.andWhere('producto.sucursalId = :sucursalId', { sucursalId });
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
    user?: AuthUser | null,
    proveedorId?: string,
    sucursalId?: string,
  ): Promise<PaginatedResponseDto<Producto>> {
    const pageVal = Number(paginationDto.pageNumber || 1);
    const sizeVal = Number(paginationDto.pageSize || 10);
    const skip = (pageVal - 1) * sizeVal;

    const queryBuilder = this.repo.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.sucursal', 'sucursal');

    if (user && user.role === 'proveedor') {
      queryBuilder.andWhere('producto.proveedorId = :proveedorId', { proveedorId: user.id });
    } else if (proveedorId) {
      if (proveedorId === 'internos') {
        queryBuilder.andWhere('producto.proveedorId IS NULL');
      } else {
        queryBuilder.andWhere('producto.proveedorId = :proveedorId', { proveedorId });
      }
    } else if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      // Si no especificaron proveedor y no son admin ni superadmin, forzar a internos
      queryBuilder.andWhere('producto.proveedorId IS NULL');
    }

    // Filtrado por sucursal (aplica a inventario de tienda, no restringe catálogo de proveedor)
    if (!proveedorId || proveedorId === 'internos') {
      if (user && user.role === 'superadmin') {
        if (sucursalId && sucursalId !== 'todas') {
          queryBuilder.andWhere('producto.sucursalId = :sucursalId', { sucursalId });
        }
      } else if (user?.sucursalId) {
        queryBuilder.andWhere('producto.sucursalId = :sucursalId', { sucursalId: user.sucursalId });
      } else if (sucursalId && sucursalId !== 'todas') {
        queryBuilder.andWhere('producto.sucursalId = :sucursalId', { sucursalId });
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

  findOne(id: string): Promise<Producto | null> {
    return this.repo.findOne({ where: { id }, relations: ['sucursal'] });
  }

  async create(data: Partial<Producto>, user?: AuthUser | null): Promise<Producto> {
    if (user) {
      if (user.role === 'proveedor') {
        data.proveedorId = user.id;
        if (user.sucursalId && !data.sucursalId) {
          data.sucursalId = user.sucursalId;
        }
      } else if (user.sucursalId && user.role !== 'superadmin') {
        data.sucursalId = user.sucursalId;
      }
    }

    if (data.nombre) {
      const existing = await this.repo.findOne({ 
        where: { 
          nombre: ILike(data.nombre),
          proveedorId: data.proveedorId || IsNull(),
          sucursalId: data.sucursalId || IsNull(),
        } 
      });
      if (existing) {
        throw new BadRequestException("Ya existe un producto con este nombre en el catálogo de esta sucursal.");
      }
    }
    
    if (data.cantidad !== undefined) {
      if (data.contable !== false) {
        data.disponible = data.cantidad > 0;
      }
    }
    
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Producto>): Promise<Producto | null> {
    let current = null;
    if (data.nombre || (data.cantidad !== undefined && data.contable === undefined)) {
      current = await this.findOne(id);
    }

    if (data.nombre && current) {
      if (current.nombre !== data.nombre) {
        const targetSucursalId = data.sucursalId !== undefined ? data.sucursalId : current.sucursalId;
        const existing = await this.repo.findOne({ 
          where: { 
            nombre: ILike(data.nombre),
            proveedorId: current.proveedorId || IsNull(),
            sucursalId: targetSucursalId || IsNull(),
            id: Not(id)
          } 
        });
        if (existing) {
          throw new BadRequestException("Ya existe un producto con este nombre en el catálogo de esta sucursal.");
        }
      }
    }
    
    if (data.cantidad !== undefined) {
      const isContable = data.contable !== undefined ? data.contable : current?.contable;
      if (isContable !== false) {
        data.disponible = data.cantidad > 0;
      }
    }
    
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async getUniqueNames(): Promise<Partial<Producto>[]> {
    const query = this.repo.createQueryBuilder('producto')
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
