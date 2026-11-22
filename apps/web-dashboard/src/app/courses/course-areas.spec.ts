import { ALL_AREAS, areaChips, inArea, OTHER_AREAS } from './course-areas';

/** ACA-001 BR .14 — area chips. */
const course = (area: string | null) => ({ subject: { area } });

describe('areaChips', () => {
  it('lists distinct areas alphabetically with counts, then "Otras", after "Todas"', () => {
    const courses = [course('Ciencias'), course(' ciencias '), course('Humanidades'), course(null), course('  '), course('Artes')];
    expect(areaChips(courses)).toEqual([
      { key: ALL_AREAS, label: 'Todas', count: 6 },
      { key: 'artes', label: 'Artes', count: 1 },
      { key: 'ciencias', label: 'Ciencias', count: 2 },
      { key: 'humanidades', label: 'Humanidades', count: 1 },
      { key: OTHER_AREAS, label: 'Otras', count: 2 },
    ]);
  });

  it('shows no "Otras" when every course has an area', () => {
    expect(areaChips([course('Artes')]).map((c) => c.label)).toEqual(['Todas', 'Artes']);
  });

  it('filters by chip', () => {
    expect(inArea(course(' Ciencias'), 'ciencias')).toBe(true);
    expect(inArea(course(null), OTHER_AREAS)).toBe(true);
    expect(inArea(course('Artes'), 'ciencias')).toBe(false);
    expect(inArea(course('Artes'), ALL_AREAS)).toBe(true);
  });
});
