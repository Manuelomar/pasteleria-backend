import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Producto } from '../../entities/producto.entity';
import { GastosModule } from '../gastos/gastos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Producto]), GastosModule],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
