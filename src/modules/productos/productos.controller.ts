import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Producto } from '../../entities/producto.entity';
import { RequestWithUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('disponible') disponible?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<Producto[]> {
    const isDisp = disponible === 'true' ? true : disponible === 'false' ? false : undefined;
    return this.service.findAll(req.user, isDisp, sucursalId);
  }

  @Get('paged')
  findAllPaged(
    @Request() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('disponible') disponible?: string,
    @Query('proveedorId') proveedorId?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<PaginatedResponseDto<Producto>> {
    const isDisp = disponible === 'true' ? true : disponible === 'false' ? false : undefined;
    return this.service.findAllPaged(paginationDto, search, tipo, isDisp, req.user, proveedorId, sucursalId);
  }

  @Public()
  @Get('public/paged')
  async findPublicPaged(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('disponible') disponible?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<PaginatedResponseDto<Partial<Producto>>> {
    const isDisp = disponible === 'true' ? true : disponible === 'false' ? false : undefined;
    const res = await this.service.findAllPaged(paginationDto, search, tipo, isDisp, null, 'internos', sucursalId);
    
    // Clean sensitive data
    const sanitizedData = res.data.map((p) => {
      const { precioCosto, historialCostos, ...publicProduct } = p;
      return publicProduct as Partial<Producto>;
    });

    return new PaginatedResponseDto(sanitizedData, res.total, res.page, res.pageSize);
  }

  @Public()
  @Get('public/all')
  async findPublicAll(@Query('sucursalId') sucursalId?: string): Promise<Partial<Producto>[]> {
    const productos = await this.service.findAll(null, true, sucursalId);
    return productos
      .filter(p => !p.proveedorId && p.tipo !== 'material')
      .map((p) => {
        const { precioCosto, historialCostos, ...publicProduct } = p;
        return publicProduct as Partial<Producto>;
      });
  }

  @Get('unique')
  getUniqueNames(): Promise<Partial<Producto>[]> {
    return this.service.getUniqueNames();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Producto | null> {
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
  uploadFile(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/productos/${file.filename}` };
  }

  @Post()
  create(@Body() data: Partial<Producto>, @Request() req: RequestWithUser): Promise<Producto> {
    return this.service.create(data, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Producto>): Promise<Producto | null> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.service.remove(id);
  }
}
