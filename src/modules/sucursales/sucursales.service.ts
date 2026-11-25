import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Sucursal } from '../../entities/sucursal.entity';
import { Producto } from '../../entities/producto.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { ClonarCatalogoDto, ClonarCatalogoResponseDto } from './dto/clonar-catalogo.dto';

@Injectable()
export class SucursalesService {
    constructor(
        @InjectRepository(Sucursal)
        private readonly sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Producto)
        private readonly productoRepo: Repository<Producto>,
    ) {}

    async findAll(includeInactivas = false): Promise<Sucursal[]> {
        const query = this.sucursalRepo.createQueryBuilder('sucursal');
        if (!includeInactivas) {
            query.where('sucursal.activa = :activa', { activa: true });
        }
        return query.orderBy('sucursal.nombre', 'ASC').getMany();
    }

    async findById(id: string): Promise<Sucursal> {
        const sucursal = await this.sucursalRepo.findOne({ where: { id } });
        if (!sucursal) {
            throw new NotFoundException(`Sucursal con ID "${id}" no encontrada`);
        }
        return sucursal;
    }

    async findByCodigo(codigo: string): Promise<Sucursal | null> {
        return this.sucursalRepo.findOne({ where: { codigo } });
    }

    async create(dto: CreateSucursalDto): Promise<Sucursal> {
        const codigoUpper = dto.codigo.trim().toUpperCase();
        const existingCodigo = await this.sucursalRepo.findOne({ where: { codigo: codigoUpper } });
        if (existingCodigo) {
            throw new ConflictException(`Ya existe una sucursal con el código "${codigoUpper}"`);
        }

        const existingNombre = await this.sucursalRepo.findOne({ where: { nombre: dto.nombre.trim() } });
        if (existingNombre) {
            throw new ConflictException(`Ya existe una sucursal con el nombre "${dto.nombre.trim()}"`);
        }

        const sucursal = this.sucursalRepo.create({
            nombre: dto.nombre.trim(),
            codigo: codigoUpper,
            direccion: dto.direccion?.trim() || null,
            telefono: dto.telefono?.trim() || null,
            activa: dto.activa ?? true,
        });

        return this.sucursalRepo.save(sucursal);
    }

    async update(id: string, dto: UpdateSucursalDto): Promise<Sucursal> {
        const sucursal = await this.findById(id);

        if (dto.codigo && dto.codigo.trim().toUpperCase() !== sucursal.codigo) {
            const codigoUpper = dto.codigo.trim().toUpperCase();
            const existingCodigo = await this.sucursalRepo.findOne({ where: { codigo: codigoUpper } });
            if (existingCodigo && existingCodigo.id !== id) {
                throw new ConflictException(`Ya existe otra sucursal con el código "${codigoUpper}"`);
            }
            sucursal.codigo = codigoUpper;
        }

        if (dto.nombre && dto.nombre.trim() !== sucursal.nombre) {
            const nombreTrim = dto.nombre.trim();
            const existingNombre = await this.sucursalRepo.findOne({ where: { nombre: nombreTrim } });
            if (existingNombre && existingNombre.id !== id) {
                throw new ConflictException(`Ya existe otra sucursal con el nombre "${nombreTrim}"`);
            }
            sucursal.nombre = nombreTrim;
        }

        if (dto.direccion !== undefined) {
            sucursal.direccion = dto.direccion?.trim() || null;
        }

        if (dto.telefono !== undefined) {
            sucursal.telefono = dto.telefono?.trim() || null;
        }

        if (dto.activa !== undefined) {
            sucursal.activa = dto.activa;
        }

        return this.sucursalRepo.save(sucursal);
    }

    async toggleActiva(id: string): Promise<Sucursal> {
        const sucursal = await this.findById(id);
        sucursal.activa = !sucursal.activa;
        return this.sucursalRepo.save(sucursal);
    }

    async clonarCatalogo(destinoId: string, dto: ClonarCatalogoDto): Promise<ClonarCatalogoResponseDto> {
        const destino = await this.findById(destinoId);
        const origen = await this.findById(dto.sucursalOrigenId);

        if (destino.id === origen.id) {
            throw new BadRequestException('La sucursal origen y destino no pueden ser la misma.');
        }

        // Obtener productos de la sucursal origen que sean internos (proveedorId IS NULL)
        const productosOrigen = await this.productoRepo.find({
            where: {
                sucursalId: origen.id,
                proveedorId: IsNull(),
            },
        });

        if (productosOrigen.length === 0) {
            throw new BadRequestException(`La sucursal origen "${origen.nombre}" no tiene productos para clonar.`);
        }

        // Obtener productos que ya existen en la sucursal destino para no duplicar nombres
        const productosDestino = await this.productoRepo.find({
            where: {
                sucursalId: destino.id,
                proveedorId: IsNull(),
            },
        });

        const nombresDestinoLower = new Set(productosDestino.map(p => p.nombre.toLowerCase().trim()));

        const productosAClonar: Producto[] = [];

        for (const p of productosOrigen) {
            if (nombresDestinoLower.has(p.nombre.toLowerCase().trim())) {
                continue; // Ya existe en la sucursal destino
            }

            const cantidadInicial = dto.clonarStock ? Number(p.cantidad || 0) : 0;
            const disponibleInicial = p.contable !== false 
                ? cantidadInicial > 0 
                : (dto.clonarStock ? Boolean(p.disponible) : false);

            const nuevo = this.productoRepo.create({
                nombre: p.nombre,
                categoria: p.categoria,
                tipo: p.tipo,
                precioCosto: p.precioCosto,
                precio: p.precio,
                precioUber: p.precioUber,
                precioPedidosYa: p.precioPedidosYa,
                disponible: disponibleInicial,
                contable: p.contable,
                imagen: p.imagen,
                descripcion: p.descripcion,
                vendidos: 0,
                cantidad: cantidadInicial,
                historialCostos: p.historialCostos ? [...p.historialCostos] : [],
                sucursalId: destino.id,
                proveedorId: null,
            });

            productosAClonar.push(nuevo);
        }

        if (productosAClonar.length > 0) {
            await this.productoRepo.save(productosAClonar);
        }

        const omitidos = productosOrigen.length - productosAClonar.length;
        const extraMsg = omitidos > 0 ? ` (${omitidos} productos omitidos porque ya existían en el destino)` : '';

        return {
            success: true,
            count: productosAClonar.length,
            message: `Se clonaron exitosamente ${productosAClonar.length} productos de "${origen.nombre}" a "${destino.nombre}".${extraMsg}`,
        };
    }
}
