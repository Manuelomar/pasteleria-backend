import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';
import { CategoriasService } from './modules/categorias/categorias.service';
import { TipoProducto } from './entities/categoria.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        private readonly usersService: UsersService,
        private readonly categoriasService: CategoriasService,
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
            // { nombre: 'Pasteles', tipo: 'dulce' },
            // { nombre: 'Bizcochos', tipo: 'dulce' },
            { nombre: 'Tres leches', tipo: 'dulce' },
            { nombre: 'Cuatro leches', tipo: 'dulce' },
            { nombre: 'Cuatro leche de chocolate', tipo: 'dulce' },
            // { nombre: 'Galletas', tipo: 'dulce' },
            { nombre: 'Brownies', tipo: 'dulce' },
            // { nombre: 'Postres', tipo: 'dulce' },
            { nombre: 'Empanadas', tipo: 'salado' },
            { nombre: 'Quipes', tipo: 'salado' },
            { nombre: 'Croquetas', tipo: 'salado' },
            { nombre: 'Café', tipo: 'bebida' },
            { nombre: 'Batidas', tipo: 'bebida' },
            { nombre: 'Malteadas', tipo: 'bebida' },
        ];

        for (const cat of defaultCategorias) {
            const existing = await this.categoriasService.findByName(cat.nombre);
            if (!existing) {
                await this.categoriasService.create(cat);
                console.log(`Default category created: ${cat.nombre} (${cat.tipo})`);
            }
        }
    }
}
