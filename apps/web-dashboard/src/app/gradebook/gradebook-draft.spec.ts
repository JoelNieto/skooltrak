import { applyEdits, cellKey, changedCells } from './gradebook-draft';
import type { Gradebook } from './gradebook-grid';

/** ASM-001-S03: the grid with unsaved values applied (FR-ASM-001.4, .5; BR .2, .4, .5). */
const T = '2026-11-20T10:00:00.000Z';
const book = (): Gradebook => ({
  course: { id: 'C1', name: 'Matemáticas' },
  metric: { minimum: 1, maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 },
  periods: [],
  periodId: 'T1',
  classGroups: [],
  classGroupId: 'G1',
  buckets: [
    { id: 'B-daily', name: 'Trabajo diario', weight: 40, columns: [{ id: 'G-d', title: 'Tarea', date: T, published: true }] },
    { id: 'B-tests', name: 'Pruebas', weight: 60, columns: [{ id: 'G-t', title: 'Prueba', date: T, published: false }] },
  ],
  rows: [
    {
      student: { id: 'S-ana', firstName: 'Ana', name: 'Ana Pérez', initials: 'AP', color: null },
      cells: [
        { gradeId: 'G-d', studentGradeId: 'sg1', score: 4, updatedAt: T },
        { gradeId: 'G-t', studentGradeId: 'sg2', score: 4, updatedAt: T },
      ],
      average: 4,
      status: 'ON_TRACK',
    },
    {
      student: { id: 'S-beto', firstName: 'Beto', name: 'Beto Ruiz', initials: 'BR', color: null },
      cells: [
        { gradeId: 'G-d', studentGradeId: null, score: null, updatedAt: null },
        { gradeId: 'G-t', studentGradeId: null, score: null, updatedAt: null },
      ],
      average: null,
      status: null,
    },
  ],
  footer: { columns: [], average: null },
  includesDrafts: true,
});

describe('applyEdits', () => {
  it('shows saved values without edits; published cells are not inputs', () => {
    const view = applyEdits(book(), {});
    expect(view.rows[0].cells.map((c) => [c.text, c.editable])).toEqual([
      ['4', false],
      ['4', true],
    ]);
    expect(view.rows[0].average).toBe(4);
    expect([view.changed, view.invalid]).toEqual([0, 0]);
  });

  it('recalculates averages, status and footer from typed values @FR-ASM-001.5', () => {
    const view = applyEdits(book(), {
      [cellKey('G-t', 'S-ana')]: { text: '2', updatedAt: T },
      [cellKey('G-t', 'S-beto')]: { text: '3,5', updatedAt: null },
    });
    // Ana: 4 × 40 + 2 × 60 = 2.8 (BR .4); Beto: tests only, 3.5.
    expect(view.rows[0].average).toBeCloseTo(2.8, 10);
    expect(view.rows[0].status).toBe('AT_RISK');
    expect([view.rows[1].average, view.rows[1].status]).toEqual([3.5, 'ON_TRACK']);
    expect(view.footer.columns).toEqual([4, 2.75]);
    expect(view.changed).toBe(2);
  });

  it('flags invalid values and keeps the saved score in the averages @BR-ASM-001.2', () => {
    const view = applyEdits(book(), { [cellKey('G-t', 'S-ana')]: { text: '7', updatedAt: T } });
    const cell = view.rows[0].cells[1];
    expect([cell.error, cell.score, cell.changed]).toEqual(['Entre 1 y 5', 4, true]);
    expect([view.changed, view.invalid]).toEqual([0, 1]);
  });

  it('ignores edits to published columns', () => {
    const view = applyEdits(book(), { [cellKey('G-d', 'S-ana')]: { text: '1', updatedAt: T } });
    expect(view.rows[0].cells[0].score).toBe(4);
    expect(view.changed).toBe(0);
  });

  it('makes every cell read-only without a scale', () => {
    const b = { ...book(), metric: null };
    expect(applyEdits(b, {}).rows[0].cells.every((c) => !c.editable)).toBe(true);
  });
});

describe('changedCells', () => {
  it('sends valid changes with the updatedAt they were loaded with @FR-ASM-001.6', () => {
    const cells = changedCells(book(), {
      [cellKey('G-t', 'S-ana')]: { text: '4', updatedAt: T },
      [cellKey('G-t', 'S-beto')]: { text: '', updatedAt: null },
    });
    expect(cells).toEqual([]);

    expect(
      changedCells(book(), {
        [cellKey('G-t', 'S-ana')]: { text: '', updatedAt: T },
        [cellKey('G-t', 'S-beto')]: { text: '4.5', updatedAt: null },
      }),
    ).toEqual([
      { gradeId: 'G-t', studentId: 'S-ana', score: null, updatedAt: T },
      { gradeId: 'G-t', studentId: 'S-beto', score: 4.5, updatedAt: null },
    ]);
  });
});
