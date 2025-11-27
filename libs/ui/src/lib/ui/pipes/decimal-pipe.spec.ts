import { PrismaDecimalPipe } from './decimal-pipe';

describe('DecimalPipe', () => {
  it('create an instance', () => {
    const pipe = new PrismaDecimalPipe();
    expect(pipe).toBeTruthy();
  });
});
