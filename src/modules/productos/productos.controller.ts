// Trigger reload
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Producto } from '../../entities/producto.entity';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('paged')
  findAllPaged(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('disponible') disponible?: string,
  ): Promise<PaginatedResponseDto<Producto>> {
    const isDisp = disponible === 'true' ? true : disponible === 'false' ? false : undefined;
    return this.service.findAllPaged(paginationDto, search, tipo, isDisp);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
