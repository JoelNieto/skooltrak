import { COURSE_COLOR_KEYS, isCourseColor, resolveCourseColor, SUBJECT_ICON_NAMES } from './course-appearance';

describe('course appearance', () => {
  it('keeps a valid color', () => {
    expect(resolveCourseColor('c1', 'TEAL')).toBe('TEAL');
  });

  it('derives a stable color from the id when unset or invalid', () => {
    const derived = resolveCourseColor('cmwp1h25a0000m7sbuy4423k2', null);
    expect(COURSE_COLOR_KEYS).toContain(derived);
    expect(resolveCourseColor('cmwp1h25a0000m7sbuy4423k2', undefined)).toBe(derived);
    expect(resolveCourseColor('cmwp1h25a0000m7sbuy4423k2', 'PURPLE')).toBe(derived);
  });

  it('spreads ids over several colors', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `cmwcourse${i.toString(36)}xyz`);
    expect(new Set(ids.map((id) => resolveCourseColor(id, null))).size).toBeGreaterThanOrEqual(6);
  });

  it('accepts only the 8 keys', () => {
    expect(COURSE_COLOR_KEYS).toHaveLength(8);
    expect(isCourseColor('INDIGO')).toBe(true);
    expect(isCourseColor('indigo')).toBe(false);
    expect(isCourseColor(3)).toBe(false);
  });

  it('lists unique subject icons including the default', () => {
    expect(new Set(SUBJECT_ICON_NAMES).size).toBe(SUBJECT_ICON_NAMES.length);
    expect(SUBJECT_ICON_NAMES).toContain('book-open');
  });
});
