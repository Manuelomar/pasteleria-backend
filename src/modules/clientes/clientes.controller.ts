import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('paged')
  findAllPaged(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPaged(paginationDto, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
