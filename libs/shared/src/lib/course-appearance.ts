/**
 * Course color tags and subject icons (ACA-001 BR .11, FR .1–.2). Shared by the API, which
 * validates and resolves them, and the UI, which renders them through `libs/ui` tokens.
 * Plain TypeScript: no Angular or Prisma imports, so both sides can load it.
 */

/** The 8 color tags, in picker order. Matches the Prisma `CourseColor` enum. */
export const COURSE_COLORS = [
  { key: 'INDIGO', label: 'Índigo' },
  { key: 'TEAL', label: 'Verde azulado' },
  { key: 'ROSE', label: 'Rosa' },
  { key: 'VIOLET', label: 'Violeta' },
  { key: 'AMBER', label: 'Ámbar' },
  { key: 'SLATE', label: 'Pizarra' },
  { key: 'FUCHSIA', label: 'Fucsia' },
  { key: 'GREEN', label: 'Verde' },
] as const;

export type CourseColorKey = (typeof COURSE_COLORS)[number]['key'];

export const COURSE_COLOR_KEYS: readonly CourseColorKey[] = COURSE_COLORS.map((c) => c.key);

export function isCourseColor(value: unknown): value is CourseColorKey {
  return typeof value === 'string' && (COURSE_COLOR_KEYS as readonly string[]).includes(value);
}

/**
 * The color to show for a course: its own when set, otherwise one derived from its id, so a
 * course looks the same on every load without any setup.
 */
export function resolveCourseColor(id: string, color: string | null | undefined): CourseColorKey {
  if (isCourseColor(color)) return color;
  // FNV-1a: cheap, stable across runtimes, and spreads short cuid prefixes well.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return COURSE_COLOR_KEYS[(hash >>> 0) % COURSE_COLOR_KEYS.length];
}

/** Icon shown when a subject has none. */
export const DEFAULT_SUBJECT_ICON = 'book-open';

/**
 * Icons an admin can pick for a subject, by Lucide name. Each one must be in the `libs/ui` icon
 * registry; a `libs/ui` spec checks that.
 */
export const SUBJECT_ICONS = [
  { name: 'book-open', label: 'Libro' },
  { name: 'sigma', label: 'Sigma' },
  { name: 'calculator', label: 'Calculadora' },
  { name: 'flask-conical', label: 'Matraz' },
  { name: 'atom', label: 'Átomo' },
  { name: 'languages', label: 'Idiomas' },
  { name: 'globe', label: 'Globo terráqueo' },
  { name: 'landmark', label: 'Monumento' },
  { name: 'palette', label: 'Paleta' },
  { name: 'music', label: 'Música' },
  { name: 'dumbbell', label: 'Pesa' },
  { name: 'code', label: 'Código' },
  { name: 'brain', label: 'Cerebro' },
  { name: 'library', label: 'Biblioteca' },
] as const;

export type SubjectIconName = (typeof SUBJECT_ICONS)[number]['name'];

export const SUBJECT_ICON_NAMES: readonly SubjectIconName[] = SUBJECT_ICONS.map((i) => i.name);
