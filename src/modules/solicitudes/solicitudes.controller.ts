import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiTags } from '@nestjs/swagger';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudBizcochoDto } from './dto/create-solicitud-bizcocho.dto';
import { UpdateSolicitudEstadoDto } from './dto/update-solicitud-estado.dto';
import { Public } from '../../decorators/public.decorator';
import { TipoSolicitud } from '../../entities/solicitud.entity';

@ApiTags('Solicitudes')
@Controller('solicitudes')
export class SolicitudesController {
    constructor(private readonly service: SolicitudesService) {}

    @Public()
    @Post('bizcocho')
    @UseInterceptors(FileInterceptor('imagen', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const path = './public/uploads/solicitudes';
                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path, { recursive: true });
                }
                cb(null, path);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + extname(file.originalname));
            }
        })
    }))
    async createBizcocho(
        @Body() data: any,
        @UploadedFile() file?: Express.Multer.File
    ) {
        // Parse config json string from FormData if needed
        let configuracion = null;
        if (data.configuracion) {
            try {
                configuracion = typeof data.configuracion === 'string' ? JSON.parse(data.configuracion) : data.configuracion;
            } catch (e) {
                // Ignore parse errors, fallback to null
            }
        }

        const createDto: CreateSolicitudBizcochoDto = {
            nombre: data.nombre,
            apellido: data.apellido,
            correo: data.correo,
            telefono: data.telefono,
            precioEstimado: data.precioEstimado ? parseFloat(data.precioEstimado) : null,
            configuracion
        };

        const imagenReferencia = file ? `/uploads/solicitudes/${file.filename}` : undefined;
        return await this.service.createBizcocho(createDto, imagenReferencia);
    }

    @Get()
    findAll(@Query('tipo') tipo?: TipoSolicitud) {
        return this.service.findAll(tipo);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id/estado')
    updateEstado(@Param('id') id: string, @Body() updateDto: UpdateSolicitudEstadoDto) {
        return this.service.updateEstado(id, updateDto.estado);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
