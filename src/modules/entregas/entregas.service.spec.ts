import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntregasService } from './entregas.service';
import { Entrega } from '../../entities/entrega.entity';
import { EntregaItem } from '../../entities/entrega-item.entity';
import { Producto } from '../../entities/producto.entity';
import { Sucursal } from '../../entities/sucursal.entity';

describe('EntregasService', () => {
  let service: EntregasService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntregasService,
        {
          provide: getRepositoryToken(Entrega),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EntregaItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Sucursal),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EntregasService>(EntregasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
