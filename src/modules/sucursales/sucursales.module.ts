import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sucursal } from '../../entities/sucursal.entity';
import { Producto } from '../../entities/producto.entity';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Sucursal, Producto])],
    controllers: [SucursalesController],
    providers: [SucursalesService],
    exports: [SucursalesService, TypeOrmModule],
})
export class SucursalesModule {}
