import { Test, TestingModule } from '@nestjs/testing';
import { DegreesResolver } from './degrees.resolver';
import { DegreesService } from './degrees.service';

describe('DegreesResolver', () => {
  let resolver: DegreesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DegreesResolver, DegreesService],
    }).compile();

    resolver = module.get<DegreesResolver>(DegreesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
