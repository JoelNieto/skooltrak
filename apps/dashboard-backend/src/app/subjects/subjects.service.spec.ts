import { ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { SUBJECT_DENIED, SubjectsService } from './subjects.service';

/** Subject reads and writes are limited to the caller's organization. */

type Row = Record<string, unknown>;

function setup(user: Row = { userId: 'u-admin1', organizationId: 'org-1', role: 'ORG_ADMIN' }) {
  const subjects: Row[] = [
    { id: 'SB1', organizationId: 'org-1', name: 'Matemáticas', code: 'MAT' },
    { id: 'SB2', organizationId: 'org-2', name: 'Historia', code: 'HIS' },
  ];
  const matches = (row: Row, where: Row) =>
    Object.entries(where).every(([k, v]) => v === undefined || k === 'OR' || row[k] === v);
  const prisma = {
    subject: {
      findFirst: jest.fn(async ({ where }: { where: Row }) => subjects.find((s) => matches(s, where)) ?? null),
      create: jest.fn(async ({ data }: { data: Row }) => {
        const row = { id: 'SB-new', ...data };
        subjects.push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: { where: Row; data: Row }) => {
        const row = subjects.find((s) => s['id'] === where['id']);
        if (!row) throw new Error('not found');
        Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));
        return row;
      }),
      delete: jest.fn(async ({ where }: { where: Row }) =>
        subjects.splice(subjects.findIndex((s) => s['id'] === where['id']), 1)[0],
      ),
    },
  };
  const service = new SubjectsService(prisma as never, { user } as never);
  return { service, subjects };
}

describe('SubjectsService organization scope', () => {
  it('refuses a caller without an organization', async () => {
    const { service } = setup({ userId: 'u-x', organizationId: null });
    await expect(service.findOne('SB1')).rejects.toThrow(new ForbiddenException(SUBJECT_DENIED));
  });

  it('reads a subject of the caller organization and refuses another one', async () => {
    const { service } = setup();
    await expect(service.findOne('SB1')).resolves.toMatchObject({ id: 'SB1' });
    await expect(service.findOne('SB2')).rejects.toThrow(new ForbiddenException(SUBJECT_DENIED));
  });

  it('refuses to update or delete a subject of another organization', async () => {
    const { service, subjects } = setup();
    await expect(service.update('SB2', { id: 'SB2', name: 'Hacked' })).rejects.toThrow(
      new ForbiddenException(SUBJECT_DENIED),
    );
    await expect(service.remove('SB2')).rejects.toThrow(new ForbiddenException(SUBJECT_DENIED));
    expect(subjects.find((s) => s['id'] === 'SB2')).toMatchObject({ name: 'Historia' });
  });

  it('updates only name and code, never the organization', async () => {
    const { service, subjects } = setup();
    await service.update('SB1', { id: 'SB1', name: 'Álgebra', organizationId: 'org-2' } as never);
    expect(subjects.find((s) => s['id'] === 'SB1')).toMatchObject({ name: 'Álgebra', organizationId: 'org-1' });
  });

  it('creates subjects in the caller organization, ignoring the body', async () => {
    const { service, subjects } = setup();
    await service.create({ name: 'Física', code: 'FIS', organizationId: 'org-2' } as never);
    expect(subjects[subjects.length - 1]).toMatchObject({ name: 'Física', organizationId: 'org-1' });
  });

  it('deletes a subject of the caller organization', async () => {
    const { service, subjects } = setup();
    await service.remove('SB1');
    expect(subjects.map((s) => s['id'])).toEqual(['SB2']);
  });
});
