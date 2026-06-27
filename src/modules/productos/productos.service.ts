import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      queryBuilder.andWhere('producto.tipo = :tipo', { tipo });
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

  create(data: Partial<Producto>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Producto>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
