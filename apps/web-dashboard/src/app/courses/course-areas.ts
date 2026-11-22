/**
 * ACA-001 BR .14: the *Mis cursos* filter chips. One chip per distinct subject area among the
 * courses (trimmed, case-insensitive), sorted alphabetically, plus "Otras" for courses without an
 * area; chips with no courses are not shown. "Todas" comes first.
 */
export const ALL_AREAS = '__all__';
export const OTHER_AREAS = '__other__';

export interface AreaChip {
  key: string;
  label: string;
  count: number;
}

const areaKey = (area: string | null | undefined) => {
  const trimmed = area?.trim();
  return trimmed ? trimmed.toLocaleLowerCase('es') : OTHER_AREAS;
};

export function areaChips(courses: { subject: { area: string | null } }[]): AreaChip[] {
  const byKey = new Map<string, AreaChip>();
  for (const course of courses) {
    const key = areaKey(course.subject.area);
    const chip = byKey.get(key) ?? {
      key,
      label: key === OTHER_AREAS ? 'Otras' : (course.subject.area as string).trim(),
      count: 0,
    };
    chip.count += 1;
    byKey.set(key, chip);
  }
  const areas = [...byKey.values()]
    .filter((c) => c.key !== OTHER_AREAS)
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  const other = byKey.get(OTHER_AREAS);
  return [{ key: ALL_AREAS, label: 'Todas', count: courses.length }, ...areas, ...(other ? [other] : [])];
}

/** Whether a course belongs to the chosen chip. */
export function inArea(course: { subject: { area: string | null } }, chip: string): boolean {
  return chip === ALL_AREAS || areaKey(course.subject.area) === chip;
}
