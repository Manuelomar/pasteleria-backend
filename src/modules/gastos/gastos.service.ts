import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from '../../entities/gasto.entity';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly repo: Repository<Gasto>,
  ) {}

  findAll() {
    return this.repo.find({ order: { fecha: 'DESC' } });
  }

  create(data: Partial<Gasto>) {
    const newGasto = this.repo.create({
      ...data,
      fecha: data.fecha || new Date(),
    });
    return this.repo.save(newGasto);
  }
}
