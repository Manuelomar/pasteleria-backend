import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';
import { CategoriasService } from './modules/categorias/categorias.service';
import { TipoProducto } from './entities/categoria.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        private readonly usersService: UsersService,
        private readonly categoriasService: CategoriasService,
        private readonly dataSource: DataSource,
    ) { }

    async onApplicationBootstrap() {
        await this.seedDefaultUser();
        await this.seedCategorias();
    }

    private async seedDefaultUser() {
        const username = 'ManuelOmar';
        const password = 'Bizcochao';
        
        // Check for old user "Manuel Omar" and update if exists
        const oldUser = await this.usersService.findByUsername('Manuel Omar');
        if (oldUser) {
            await this.usersService.remove(oldUser.id);
            console.log('Removed old default user');
        }

        const existing = await this.usersService.findByUsername(username);

        if (!existing) {
            await this.usersService.create({
                username: username,
                name: 'Manuel Omar',
                password: password,
                role: 'admin',
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
                },
            });
            console.log('Default user created: ManuelOmar');
        } else {
            // Update password of existing ManuelOmar
            await this.usersService.update(existing.id, { password: password });
            console.log('Default user updated: ManuelOmar');
        }
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
