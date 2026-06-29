import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Entrega } from '../../entities/entrega.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entrega, User])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
