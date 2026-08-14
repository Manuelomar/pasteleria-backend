import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, TipoSolicitud, EstadoSolicitud } from '../../entities/solicitud.entity';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SolicitudesService {
    constructor(
        @InjectRepository(Solicitud)
        private readonly repository: Repository<Solicitud>,
    ) {}

    async findAllPaged(paginationDto: PaginationDto, tipo?: TipoSolicitud): Promise<PaginatedResponseDto<Solicitud>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const query = this.repository.createQueryBuilder('s').orderBy('s.createdAt', 'DESC');
        if (tipo) {
            query.where('s.tipo = :tipo', { tipo });
        }

        query.skip(skip).take(limit);

        const [items, total] = await query.getManyAndCount();

        return {
            items,
            total,
            page: Number(page),
            pageSize: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }

    async createBizcocho(data: any, imagenReferencia?: string): Promise<Solicitud> {
        const solicitud = this.repository.create({
            ...data,
            tipo: 'bizcocho',
            imagenReferencia
        } as Partial<Solicitud>);
        return await this.repository.save(solicitud);
    }

    async createCombo(data: any, imagenReferencia?: string): Promise<Solicitud> {
        const solicitud = this.repository.create({
            ...data,
            tipo: 'combo',
            imagenReferencia
        } as Partial<Solicitud>);
        return await this.repository.save(solicitud);
    }

    async findAll(tipo?: TipoSolicitud): Promise<Solicitud[]> {
        const query = this.repository.createQueryBuilder('s').orderBy('s.createdAt', 'DESC');
        if (tipo) {
            query.where('s.tipo = :tipo', { tipo });
        }
        return await query.getMany();
    }

    async findOne(id: string): Promise<Solicitud> {
        const solicitud = await this.repository.findOne({ where: { id } });
        if (!solicitud) {
            throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
        }
        return solicitud;
    }

    async updateEstado(id: string, estado: EstadoSolicitud): Promise<Solicitud> {
        const solicitud = await this.findOne(id);
        solicitud.estado = estado;
        return await this.repository.save(solicitud);
    }

    async updateConfiguracion(id: string, configuracion: any): Promise<Solicitud> {
        const solicitud = await this.findOne(id);
        solicitud.configuracion = configuracion;
        return await this.repository.save(solicitud);
    }

    async remove(id: string): Promise<void> {
        const solicitud = await this.findOne(id);
        await this.repository.remove(solicitud);
    }
}
