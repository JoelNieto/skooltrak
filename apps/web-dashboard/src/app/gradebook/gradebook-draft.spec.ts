import { applyEdits, cellKey, cellsNeedingReason, changedCells, matchesStudent } from './gradebook-draft';
import type { Gradebook } from './gradebook-grid';

/** ASM-001-S03, S04: the grid with unsaved values applied (FR-ASM-001.4, .5, .8; BR .2, .4, .5, .8). */
const T = '2026-11-20T10:00:00.000Z';
const book = (): Gradebook => ({
  course: { id: 'C1', name: 'Matemáticas' },
  metric: { minimum: 1, maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 },
  periods: [],
  periodId: 'T1',
  classGroups: [],
  classGroupId: 'G1',
  buckets: [
    { id: 'B-daily', name: 'Trabajo diario', weight: 40, columns: [{ id: 'G-d', title: 'Tarea', date: T, published: true, publishedAt: T, assignment: null }] },
    { id: 'B-tests', name: 'Pruebas', weight: 60, columns: [{ id: 'G-t', title: 'Prueba', date: T, published: false, publishedAt: null, assignment: null }] },
  ],
  rows: [
    {
      student: { id: 'S-ana', firstName: 'Ana', name: 'Ana Pérez', documentId: '8-123-456', initials: 'AP', color: null },
      cells: [
        { gradeId: 'G-d', studentGradeId: 'sg1', score: 4, excused: false, comment: 'Bien', updatedAt: T },
        { gradeId: 'G-t', studentGradeId: 'sg2', score: 4, excused: false, comment: null, updatedAt: T },
      ],
      average: 4,
      status: 'ON_TRACK',
    },
    {
      student: { id: 'S-beto', firstName: 'Beto', name: 'Beto Ruiz', documentId: '8-222-333', initials: 'BR', color: null },
      cells: [
        { gradeId: 'G-d', studentGradeId: null, score: null, excused: false, comment: null, updatedAt: null },
        { gradeId: 'G-t', studentGradeId: null, score: null, excused: false, comment: null, updatedAt: null },
      ],
      average: null,
      status: null,
    },
  ],
  footer: { columns: [], average: null },
  includesDrafts: true,
});

describe('applyEdits', () => {
  it('shows saved values and comments; every cell is an input once a scale exists', () => {
    const view = applyEdits(book(), {});
    expect(view.rows[0].cells.map((c) => [c.text, c.editable, c.published, c.comment])).toEqual([
      ['4', true, true, 'Bien'],
      ['4', true, false, ''],
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

  it('flags a changed published score as needing a reason @BR-ASM-001.8', () => {
    const view = applyEdits(book(), {
      [cellKey('G-d', 'S-ana')]: { text: '1', updatedAt: T },
      [cellKey('G-t', 'S-ana')]: { text: '2', updatedAt: T },
    });
    expect(view.rows[0].cells.map((c) => [c.score, c.needsReason])).toEqual([
      [1, true],
      [2, false],
    ]);
    expect(cellsNeedingReason(view).map((c) => c.key)).toEqual([cellKey('G-d', 'S-ana')]);

    const explained = applyEdits(book(), { [cellKey('G-d', 'S-ana')]: { text: '1', updatedAt: T, reason: 'Recalificada' } });
    expect(cellsNeedingReason(explained)).toEqual([]);
  });

  it('counts a comment-only change, which needs no reason @BR-ASM-001.14', () => {
    const view = applyEdits(book(), { [cellKey('G-d', 'S-ana')]: { text: '4', updatedAt: T, comment: 'Muy bien' } });
    const cell = view.rows[0].cells[0];
    expect([cell.changed, cell.needsReason, cell.comment]).toEqual([true, false, 'Muy bien']);
    expect(view.changed).toBe(1);
  });

  it('flags a comment over 500 characters', () => {
    const view = applyEdits(book(), { [cellKey('G-t', 'S-ana')]: { text: '4', updatedAt: T, comment: 'x'.repeat(501) } });
    expect(view.invalid).toBe(1);
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

describe('changedCells with comments and reasons', () => {
  it("sends a cell's comment and its own valid reason", () => {
    expect(
      changedCells(book(), {
        [cellKey('G-d', 'S-ana')]: { text: '3', updatedAt: T, comment: '', reason: '  Recalificada ' },
        [cellKey('G-t', 'S-ana')]: { text: '4', updatedAt: T, comment: 'Revisar' },
      }),
    ).toEqual([
      { gradeId: 'G-d', studentId: 'S-ana', score: 3, updatedAt: T, comment: '', reason: 'Recalificada' },
      { gradeId: 'G-t', studentId: 'S-ana', score: 4, updatedAt: T, comment: 'Revisar' },
    ]);
  });
});

describe('excused cells (ASM-001-S05, BR .3)', () => {
  it('typing EX excuses the cell and leaves it out of the average', () => {
    const view = applyEdits(book(), { [cellKey('G-t', 'S-ana')]: { text: 'ex', updatedAt: T } });
    const cell = view.rows[0].cells[1];
    expect([cell.excused, cell.score, cell.changed, cell.error]).toEqual([true, null, true, null]);
    // Only "Trabajo diario" (4) is left.
    expect(view.rows[0].average).toBe(4);
    expect(changedCells(book(), { [cellKey('G-t', 'S-ana')]: { text: 'EX', updatedAt: T } })).toEqual([
      { gradeId: 'G-t', studentId: 'S-ana', score: null, excused: true, updatedAt: T },
    ]);
  });

  it('excusing a published cell needs a reason', () => {
    const view = applyEdits(book(), { [cellKey('G-d', 'S-ana')]: { text: 'EX', updatedAt: T } });
    expect(view.rows[0].cells[0].needsReason).toBe(true);
  });

  it('shows a saved exemption as EX, and typing a score over it is a change', () => {
    const b = book();
    b.rows[1].cells[1] = { gradeId: 'G-t', studentGradeId: 'sg3', score: null, excused: true, comment: null, updatedAt: T };
    expect(applyEdits(b, {}).rows[1].cells[1].text).toBe('EX');
    const view = applyEdits(b, { [cellKey('G-t', 'S-beto')]: { text: '3', updatedAt: T } });
    expect([view.rows[1].cells[1].excused, view.rows[1].cells[1].score, view.changed]).toEqual([false, 3, 1]);
  });
});

describe('matchesStudent (FR-ASM-001.12)', () => {
  const ana = { name: 'Ana Pérez', documentId: '8-123-456' };
  it.each([
    ['', true],
    ['ana', true],
    ['PEREZ', true],
    ['pér', true],
    ['8-123', true],
    ['8123456', true],
    ['beto', false],
    ['8-222', false],
  ])('%j → %s', (query, expected) => {
    expect(matchesStudent(ana, query)).toBe(expected);
  });
});

