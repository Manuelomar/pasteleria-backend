import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { Venta } from '../../entities/venta.entity';
import { VentaItem } from '../../entities/venta-item.entity';
import { Producto } from '../../entities/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, VentaItem, Producto])],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
