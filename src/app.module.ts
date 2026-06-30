import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { User } from './entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductosModule } from './modules/productos/productos.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { MovimientosModule } from './modules/movimientos/movimientos.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { SeedService } from './seed.service';
import { EntregasModule } from './modules/entregas/entregas.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/',
        }),
        PassportModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 5432),
                username: configService.get<string>('DB_USERNAME', 'postgres'),
                password: configService.get<string>('DB_PASSWORD', 'postgres'),
                database: configService.get<string>('DB_DATABASE', 'pasteleria'),
                ssl: configService.get<string>('DB_HOST', 'localhost') !== 'localhost' ? { rejectUnauthorized: false } : false,
                autoLoadEntities: true,
                synchronize: true, // DEV ONLY
            }),
        }),
        AuthModule,
        UsersModule,
        ProductosModule,
        ClientesModule,
        VentasModule,
        MovimientosModule,
        EntregasModule,
        ReportesModule,
    ],
    controllers: [],
    providers: [
        SeedService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule { }
