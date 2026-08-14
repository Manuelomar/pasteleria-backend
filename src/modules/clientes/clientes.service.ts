import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../../entities/cliente.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repo: Repository<Cliente>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async findAllPaged(paginationDto: PaginationDto, search?: string): Promise<PaginatedResponseDto<Cliente>> {
    const { pageNumber = 1, pageSize = 10 } = paginationDto;
    const skip = (pageNumber - 1) * pageSize;

    const queryBuilder = this.repo.createQueryBuilder('cliente');

    if (search) {
      queryBuilder.where('cliente.nombre ILIKE :search', { search: `%${search}%` })
                  .orWhere('cliente.telefono ILIKE :search', { search: `%${search}%` })
                  .orWhere('cliente.email ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('cliente.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      total,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Cliente>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Cliente>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
