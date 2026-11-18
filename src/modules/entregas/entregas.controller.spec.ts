import { Test, TestingModule } from '@nestjs/testing';
import { EntregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';

describe('EntregasController', () => {
  let controller: EntregasController;

  const mockEntregasService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllPaged: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregasController],
      providers: [
        {
          provide: EntregasService,
          useValue: mockEntregasService,
        },
      ],
    }).compile();

    controller = module.get<EntregasController>(EntregasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
