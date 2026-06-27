import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';
import { Entrega } from '../../entities/entrega.entity';
import { EntregaItem } from '../../entities/entrega-item.entity';
import { Producto } from '../../entities/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entrega, EntregaItem, Producto])],
  controllers: [EntregasController],
  providers: [EntregasService]
})
export class EntregasModule {}
