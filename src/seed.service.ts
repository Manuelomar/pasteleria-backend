import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';
import { CategoriasService } from './modules/categorias/categorias.service';
import { SucursalesService } from './modules/sucursales/sucursales.service';
import { TipoProducto } from './entities/categoria.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        private readonly usersService: UsersService,
        private readonly categoriasService: CategoriasService,
        private readonly sucursalesService: SucursalesService,
        private readonly dataSource: DataSource,
    ) { }

    async onApplicationBootstrap() {
        await this.seedDefaultSucursal();
        await this.seedDefaultUser();
        await this.seedCategorias();
    }

    private async seedDefaultSucursal() {
        try {
            const codigo = 'AR';
            let sucursal = await this.sucursalesService.findByCodigo(codigo);
            if (!sucursal) {
                sucursal = await this.sucursalesService.create({
                    nombre: 'Bizcochao Alma Rosa',
                    codigo: 'AR',
                    direccion: 'Alma Rosa, Santo Domingo Este',
                    telefono: '',
                    activa: true,
                });
                console.log('Default sucursal created: Bizcochao Alma Rosa (AR)');
            }

            // Asignar productos y ventas existentes a la sucursal 1 (Alma Rosa)
            await this.dataSource.query('UPDATE productos SET "sucursalId" = $1 WHERE "sucursalId" IS NULL', [sucursal.id]);
            await this.dataSource.query('UPDATE ventas SET "sucursalId" = $1 WHERE "sucursalId" IS NULL', [sucursal.id]);
        } catch (error) {
            console.log('Error seeding default sucursal:', error);
        }
    }

    private async seedDefaultUser() {
        const existingSuperadmin = await this.usersService.findSuperadmin();
        if (existingSuperadmin) {
            console.log(`Superadmin already exists (${existingSuperadmin.username}), skipping default user seed.`);
            return;
        }

        const allUsers = await this.usersService.findAll();
        if (allUsers.length > 0) {
            console.log('Users already exist in database, skipping default user seed.');
            return;
        }

        const username = 'ManuelOmar';
        const password = 'Bizcochao';

        await this.usersService.create({
            username: username,
            name: 'Manuel Omar',
            password: password,
            role: 'superadmin',
            sucursalId: null,
            permissions: {
                clientes: true,
                clientes_crear: true,
                clientes_editar: true,
                clientes_eliminar: true,
                catalogo: true,
                catalogo_crear: true,
                catalogo_editar: true,
                catalogo_eliminar: true,
                ventas: true,
                ventas_crear: true,
                ventas_editar: true,
                ventas_eliminar: true,
                ventas_registrarPago: true,
                graficos: true,
                graficos_filtroAmbos: true,
                graficos_filtroConItbis: true,
                graficos_filtroSinItbis: true,
                estadoCuenta: true,
                estadoCuenta_exportar: true,
                estadoCuenta_filtros: true,
                entregas: true,
                entregas_crear: true,
                entregas_gestionar: true,
                inventario: true,
            },
        });
        console.log('Default initial superadmin user created: ManuelOmar');
    }

    private async seedCategorias() {
        const defaultCategorias: { nombre: string; tipo: TipoProducto }[] = [
            { nombre: 'Postres', tipo: 'dulce' },
            { nombre: 'Salados', tipo: 'salado' },
            { nombre: 'Bebidas', tipo: 'bebida' },
            { nombre: 'Bizcochos', tipo: 'dulce' },
            { nombre: 'Combos', tipo: 'dulce' },
        ];

        for (const cat of defaultCategorias) {
            const existing = await this.categoriasService.findByName(cat.nombre);
            if (!existing) {
                await this.categoriasService.create(cat);
                console.log(`Default category created: ${cat.nombre} (${cat.tipo})`);
            }
        }

        // Migrate old products to new categories
        try {
            await this.dataSource.query(`UPDATE productos SET categoria = 'Bebidas' WHERE categoria IN ('Batidas', 'Malteadas', 'Café')`);
            await this.dataSource.query(`UPDATE productos SET categoria = 'Bizcochos' WHERE categoria IN ('Pasteles')`);
            await this.dataSource.query(`UPDATE productos SET categoria = 'Postres' WHERE categoria IN ('Brownies', 'Tres leches', 'Cuatro leches', 'Cuatro leche de chocolate', 'Galletas')`);
            await this.dataSource.query(`UPDATE productos SET categoria = 'Salados' WHERE categoria IN ('Empanadas', 'Croquetas', 'Quipes')`);
            
            // Delete ALL old categories from the database except the 5 official ones
            await this.dataSource.query(`DELETE FROM categorias WHERE nombre NOT IN ('Postres', 'Salados', 'Bebidas', 'Bizcochos', 'Combos')`);
            console.log('Old categories migrated and cleaned up successfully.');
        } catch (error) {
            console.log('Error migrating old categories:', error);
        }
    }
}
