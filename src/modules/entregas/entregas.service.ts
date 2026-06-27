import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega, EstadoEntrega, EstadoPagoEntrega } from '../../entities/entrega.entity';
import { Producto } from '../../entities/producto.entity';

import { IsString, IsDateString, IsArray, IsNotEmpty, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class EntregaItemDto {
    @IsString()
    @IsNotEmpty()
    productoId: string;

    @IsNumber()
    cantidad: number;
}

export class CreateEntregaDto {
    @IsString()
    @IsOptional()
    proveedorId: string;

    @IsDateString()
    @IsNotEmpty()
    fechaPrevista: Date;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EntregaItemDto)
    items: EntregaItemDto[];
}

@Injectable()
export class EntregasService {
    constructor(
        @InjectRepository(Entrega)
        private entregaRepository: Repository<Entrega>,
        @InjectRepository(Producto)
        private productoRepository: Repository<Producto>
    ) {}

    async create(createEntregaDto: CreateEntregaDto, user: any) {
        const { proveedorId, fechaPrevista, items } = createEntregaDto;
        
        let totalCosto = 0;
        const entregaItems = [];

        for (const item of items) {
            const producto = await this.productoRepository.findOne({ where: { id: item.productoId }});
            if (!producto) {
                throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
            }
            if (producto.proveedorId !== proveedorId && user.role !== 'admin') {
                throw new BadRequestException(`Producto ${producto.nombre} no pertenece al proveedor ${proveedorId}`);
            }

            const itemCosto = producto.precioCosto * item.cantidad;
            totalCosto += itemCosto;

            entregaItems.push({
                productoId: producto.id,
                cantidad: item.cantidad,
                precioCosto: producto.precioCosto,
            });
        }

        const entrega = this.entregaRepository.create({
            proveedorId,
            fechaPrevista,
            totalCosto,
            items: entregaItems,
            estadoEntrega: 'en_espera',
            estadoPago: 'pendiente_pago'
        });

        return this.entregaRepository.save(entrega);
    }

    async findAll(user: any, filtro?: string) {
        const query = this.entregaRepository.createQueryBuilder('entrega')
            .leftJoinAndSelect('entrega.proveedor', 'proveedor')
            .leftJoinAndSelect('entrega.items', 'items')
            .leftJoinAndSelect('items.producto', 'producto')
            .orderBy('entrega.createdAt', 'DESC');
        
        if (user.role === 'proveedor') {
            query.where('entrega.proveedorId = :proveedorId', { proveedorId: user.id });
        }
        
        if (filtro && filtro !== 'todos') {
            if (filtro === 'pendiente') {
                query.andWhere('entrega.estadoEntrega = :estadoE AND entrega.estadoPago = :estadoP', { estadoE: 'en_espera', estadoP: 'pendiente_pago' });
            } else if (filtro === 'pagado_no_entregado') {
                query.andWhere('entrega.estadoEntrega = :estadoE AND entrega.estadoPago = :estadoP', { estadoE: 'en_espera', estadoP: 'pagado' });
            } else if (filtro === 'entregado_no_pagado') {
                query.andWhere('entrega.estadoEntrega = :estadoE AND entrega.estadoPago = :estadoP', { estadoE: 'entregada', estadoP: 'pendiente_pago' });
            } else if (filtro === 'finalizado') {
                query.andWhere('entrega.estadoEntrega = :estadoE AND entrega.estadoPago = :estadoP', { estadoE: 'entregada', estadoP: 'pagado' });
            }
        }
        
        return query.getMany();
    }

    async updateEstadoEntrega(id: string, estado: EstadoEntrega) {
        const entrega = await this.entregaRepository.findOne({ where: { id }});
        if (!entrega) throw new NotFoundException('Entrega no encontrada');
        
        entrega.estadoEntrega = estado;
        if (estado === 'entregada') {
            entrega.fechaReal = new Date();
        } else {
            entrega.fechaReal = null;
        }
        return this.entregaRepository.save(entrega);
    }

    async updateEstadoPago(id: string, estado: EstadoPagoEntrega) {
        const entrega = await this.entregaRepository.findOne({ where: { id }});
        if (!entrega) throw new NotFoundException('Entrega no encontrada');
        
        entrega.estadoPago = estado;
        return this.entregaRepository.save(entrega);
    }
}
