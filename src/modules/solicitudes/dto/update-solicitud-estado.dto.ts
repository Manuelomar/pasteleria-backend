import { IsEnum } from 'class-validator';
import { EstadoSolicitud } from '../../../entities/solicitud.entity';

export class UpdateSolicitudEstadoDto {
    @IsEnum(['pendiente', 'en-proceso', 'completada', 'cancelada'])
    estado: EstadoSolicitud;
}
