import { Controller, Get, Post, Body } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { Gasto } from '../../entities/gasto.entity';

@Controller('gastos')
export class GastosController {
  constructor(private readonly service: GastosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: Partial<Gasto>) {
    return this.service.create(data);
  }
}
