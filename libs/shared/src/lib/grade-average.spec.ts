import { courseAverage, gradeStatus, meanOf } from './grade-average';

const cell = (bucketId: string, weight: number, score: number | null) => ({ bucketId, weight, score });

describe('courseAverage (ASM-001 BR .4)', () => {
  it('weights each bucket by its mean, not by its number of cells', () => {
    const cells = [
      ...[4, 4, 4, 4].map((s) => cell('daily', 40, s)),
      cell('tests', 60, 2),
    ];
    expect(courseAverage(cells)).toBeCloseTo(2.8, 10);
  });

  it('skips empty cells, and buckets without a scored cell', () => {
    const cells = [cell('daily', 40, 4), cell('daily', 40, null), cell('tests', 60, null), cell('projects', 20, 2)];
    // daily mean 4 (weight 40), projects 2 (weight 20); tests has no score and no weight.
    expect(courseAverage(cells)).toBeCloseTo((4 * 40 + 2 * 20) / 60, 10);
  });

  it('has no average without a scored cell', () => {
    expect(courseAverage([])).toBeNull();
    expect(courseAverage([cell('daily', 40, null)])).toBeNull();
  });

  it('has no average when only zero-weight buckets are scored', () => {
    expect(courseAverage([cell('practice', 0, 5)])).toBeNull();
  });

  it('keeps a real zero', () => {
    expect(courseAverage([cell('tests', 100, 0)])).toBe(0);
  });
});

describe('gradeStatus (ASM-001 BR .5)', () => {
  it.each([
    [2.9, 'AT_RISK'],
    [3.0, 'WATCH'],
    [3.4, 'WATCH'],
    [3.5, 'ON_TRACK'],
    [5, 'ON_TRACK'],
  ])('%s with pass mark 3 is %s', (average, status) => {
    expect(gradeStatus(average, 3)).toBe(status);
  });

  it('bands the average as shown, rounded to one decimal', () => {
    expect(gradeStatus(2.96, 3)).toBe('WATCH');
    expect(gradeStatus(2.94, 3)).toBe('AT_RISK');
    expect(gradeStatus(3.46, 3)).toBe('ON_TRACK');
  });

  it('has no band without an average or a pass mark', () => {
    expect(gradeStatus(null, 3)).toBeNull();
    expect(gradeStatus(4, null)).toBeNull();
  });
});

describe('meanOf', () => {
  it('averages the numbers and skips the rest', () => {
    expect(meanOf([4, null, 2, undefined])).toBe(3);
    expect(meanOf([null])).toBeNull();
  });
});
