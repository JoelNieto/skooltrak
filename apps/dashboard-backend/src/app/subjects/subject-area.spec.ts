jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { cleanArea } from './subjects.service';

/** ACA-001 BR .14 — subject areas are trimmed; empty means none ("Otras"). */
describe('cleanArea', () => {
  it.each([
    ['  Ciencias ', 'Ciencias'],
    ['', null],
    ['   ', null],
    [null, null],
    [undefined, null],
  ])('%j → %j', (input, expected) => {
    expect(cleanArea(input as string | null | undefined)).toBe(expected);
  });
});
