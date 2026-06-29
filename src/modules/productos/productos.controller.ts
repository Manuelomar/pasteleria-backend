// Trigger reload
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Producto } from '../../entities/producto.entity';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Get('paged')
  findAllPaged(
    @Request() req: any,
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('disponible') disponible?: string,
    @Query('proveedorId') proveedorId?: string,
  ): Promise<PaginatedResponseDto<Producto>> {
    const isDisp = disponible === 'true' ? true : disponible === 'false' ? false : undefined;
    return this.service.findAllPaged(paginationDto, search, tipo, isDisp, req.user, proveedorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const path = './public/uploads/productos';
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
        }
        cb(null, path);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/productos/${file.filename}` };
  }

  @Post()
  create(@Body() data: any, @Request() req: any) {
    if (req.user && req.user.role === 'proveedor') {
      data.proveedorId = req.user.id;
    }
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
