import { Test, TestingModule } from '@nestjs/testing';
import { EntregasController } from './entregas.controller';

describe('EntregasController', () => {
  let controller: EntregasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregasController],
    }).compile();

    controller = module.get<EntregasController>(EntregasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
