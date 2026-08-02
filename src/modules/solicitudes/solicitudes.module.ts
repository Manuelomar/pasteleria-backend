import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { Solicitud } from '../../entities/solicitud.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Solicitud])],
    controllers: [SolicitudesController],
    providers: [SolicitudesService],
    exports: [SolicitudesService],
})
export class SolicitudesModule {}
