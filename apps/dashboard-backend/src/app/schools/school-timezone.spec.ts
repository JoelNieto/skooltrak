import { BadRequestException } from '@nestjs/common';
import { assertValidTimezone } from './schools.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S01: School.timezone must be an IANA name (BR-HOM-001.4). */
describe('assertValidTimezone', () => {
  it.each(['America/Panama', 'America/Bogota', 'UTC'])('accepts %s', (tz) => {
    expect(() => assertValidTimezone(tz)).not.toThrow();
  });

  it('ignores an omitted timezone (partial update)', () => {
    expect(() => assertValidTimezone(undefined)).not.toThrow();
  });

  it.each(['', 'Panama', 'Mars/Olympus', 'GMT+99'])('rejects %p', (tz) => {
    expect(() => assertValidTimezone(tz)).toThrow(new BadRequestException('Zona horaria inválida'));
  });
});
