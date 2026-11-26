import { planAccountSync, SyncStudent } from './account-sync';

const at = (day: number) => new Date(Date.UTC(2026, 0, day));
const st = (id: string, day: number, parentIds: string[] = []): SyncStudent => ({ id, createdAt: at(day), parentIds });

describe('planAccountSync (FR-FIN-001.1, BR-FIN-001.1)', () => {
  it('creates one account per family and puts siblings together', () => {
    const plan = planAccountSync([st('sofia', 1, ['ana']), st('mateo', 2, ['ana', 'carlos']), st('luis', 3, ['rosa'])], [], []);

    expect(plan.create.map((c) => c.number)).toEqual([1, 2]);
    expect(plan.assign).toEqual([
      { studentId: 'sofia', accountId: 'new:1', move: false },
      { studentId: 'mateo', accountId: 'new:1', move: false },
      { studentId: 'luis', accountId: 'new:2', move: false },
    ]);
    expect(plan.remove).toEqual([]);
  });

  it('gives a student without guardians an account of their own', () => {
    const plan = planAccountSync([st('solo', 1)], [{ id: 'A7', number: 7, chargeCount: 0 }], []);
    expect(plan.create).toEqual([{ tempId: 'new:8', number: 8 }]);
    expect(plan.assign).toEqual([{ studentId: 'solo', accountId: 'new:8', move: false }]);
    expect(plan.remove).toEqual(['A7']); // empty and charge-free
  });

  it('joins a new sibling to the existing family account', () => {
    const plan = planAccountSync(
      [st('sofia', 1, ['ana']), st('mateo', 5, ['ana'])],
      [{ id: 'A1', number: 1, chargeCount: 3 }],
      [{ studentId: 'sofia', accountId: 'A1' }],
    );
    expect(plan.create).toEqual([]);
    expect(plan.assign).toEqual([{ studentId: 'mateo', accountId: 'A1', move: false }]);
  });

  it('folds a solo, charge-free account into the sibling account once a guardian is linked', () => {
    const plan = planAccountSync(
      [st('sofia', 1, ['ana']), st('mateo', 5, ['ana'])],
      [
        { id: 'A1', number: 1, chargeCount: 2 },
        { id: 'A2', number: 2, chargeCount: 0 },
      ],
      [
        { studentId: 'sofia', accountId: 'A1' },
        { studentId: 'mateo', accountId: 'A2' },
      ],
    );
    expect(plan.assign).toEqual([{ studentId: 'mateo', accountId: 'A1', move: true }]);
    expect(plan.remove).toEqual(['A2']);
  });

  it('never moves a student whose account already has charges', () => {
    const plan = planAccountSync(
      [st('sofia', 1, ['ana']), st('mateo', 5, ['ana'])],
      [
        { id: 'A1', number: 1, chargeCount: 0 },
        { id: 'A2', number: 2, chargeCount: 1 },
      ],
      [
        { studentId: 'sofia', accountId: 'A1' },
        { studentId: 'mateo', accountId: 'A2' },
      ],
    );
    // Sofía's account has the lower number, so Mateo would be the one to move, and his has a charge.
    expect(plan).toEqual({ create: [], assign: [], remove: [] });
  });

  it('settles two solo siblings into the lower-numbered account without ping-pong', () => {
    const plan = planAccountSync(
      [st('sofia', 1, ['ana']), st('mateo', 2, ['ana'])],
      [
        { id: 'A1', number: 1, chargeCount: 0 },
        { id: 'A2', number: 2, chargeCount: 0 },
      ],
      [
        { studentId: 'sofia', accountId: 'A1' },
        { studentId: 'mateo', accountId: 'A2' },
      ],
    );
    expect(plan.assign).toEqual([{ studentId: 'mateo', accountId: 'A1', move: true }]);
    expect(plan.remove).toEqual(['A2']);
  });

  it('leaves multi-student accounts of different guardians apart (admin decides)', () => {
    const plan = planAccountSync(
      [st('a', 1, ['p1']), st('b', 2, ['p1']), st('c', 3, ['p2']), st('d', 4, ['p2', 'p1'])],
      [
        { id: 'A1', number: 1, chargeCount: 0 },
        { id: 'A2', number: 2, chargeCount: 0 },
      ],
      [
        { studentId: 'a', accountId: 'A1' },
        { studentId: 'b', accountId: 'A1' },
        { studentId: 'c', accountId: 'A2' },
        { studentId: 'd', accountId: 'A2' },
      ],
    );
    expect(plan).toEqual({ create: [], assign: [], remove: [] });
  });

  it('is a no-op when everything is in place', () => {
    const plan = planAccountSync(
      [st('sofia', 1, ['ana'])],
      [{ id: 'A1', number: 1, chargeCount: 0 }],
      [{ studentId: 'sofia', accountId: 'A1' }],
    );
    expect(plan).toEqual({ create: [], assign: [], remove: [] });
  });
});
