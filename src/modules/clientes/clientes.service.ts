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
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('cliente');

    if (search) {
      queryBuilder.where('cliente.nombre ILIKE :search', { search: `%${search}%` })
                  .orWhere('cliente.telefono ILIKE :search', { search: `%${search}%` })
                  .orWhere('cliente.email ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('cliente.createdAt', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page: Number(page),
      pageSize: Number(limit),
      totalPages: Math.ceil(total / limit),
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
