import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, TipoSolicitud, EstadoSolicitud } from '../../entities/solicitud.entity';

@Injectable()
export class SolicitudesService {
    constructor(
        @InjectRepository(Solicitud)
        private readonly repository: Repository<Solicitud>,
    ) {}

    async createBizcocho(data: any, imagenReferencia?: string): Promise<Solicitud> {
        const solicitud = this.repository.create({
            ...data,
            tipo: 'bizcocho',
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

    async remove(id: string): Promise<void> {
        const solicitud = await this.findOne(id);
        await this.repository.remove(solicitud);
    }
}
