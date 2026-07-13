import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria, TipoProducto } from '../../entities/categoria.entity';

@Injectable()
export class CategoriasService {
    constructor(
        @InjectRepository(Categoria)
        private categoriasRepository: Repository<Categoria>,
    ) {}

    async findAll(): Promise<Categoria[]> {
        return this.categoriasRepository.find({
            order: { nombre: 'ASC' }
        });
    }

    async findByName(nombre: string): Promise<Categoria | null> {
        return this.categoriasRepository.findOne({ where: { nombre } });
    }

    async create(data: { nombre: string; tipo: TipoProducto }): Promise<Categoria> {
        const categoria = this.categoriasRepository.create(data);
        return this.categoriasRepository.save(categoria);
    }
}
