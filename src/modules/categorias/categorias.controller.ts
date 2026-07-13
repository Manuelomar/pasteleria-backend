import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { TipoProducto } from '../../entities/categoria.entity';

@Controller('categorias')
export class CategoriasController {
    constructor(private readonly categoriasService: CategoriasService) {}

    @Get()
    findAll() {
        return this.categoriasService.findAll();
    }

    @Post()
    create(@Body() data: { nombre: string; tipo: TipoProducto }) {
        return this.categoriasService.create(data);
    }
}
