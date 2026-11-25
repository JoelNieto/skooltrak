import { UiIconName } from '#/ui';

/** One entry of the admin settings rail: a child route of `/admin`. */
export interface AdminNavItem {
  /** Child path under `/admin` ('' is the overview). */
  path: string;
  label: string;
  icon: UiIconName;
  /** Shown under the section title in the admin shell. */
  description: string;
  /** When set, the entry only shows to users holding this permission (mirrors the route guard). */
  permission?: string;
}

export interface AdminNavGroup {
  title: string;
  items: readonly AdminNavItem[];
}

/** The admin panel's sections, grouped as in the settings rail. Order matters: it is the rail's order. */
export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    title: 'General',
    items: [
      {
        path: '',
        label: 'Resumen',
        icon: 'layout-dashboard',
        description: 'El estado de la configuración de tu colegio y lo que requiere atención.',
      },
      {
        path: 'schools',
        label: 'Colegios',
        icon: 'school',
        description: 'Los colegios de tu organización, con sus datos de contacto y su marca.',
      },
    ],
  },
  {
    title: 'Estructura académica',
    items: [
      {
        path: 'degrees',
        label: 'Niveles',
        icon: 'layers',
        description: 'Los niveles o grados que ofrece tu colegio. Los planes de estudio se arman sobre ellos.',
      },
      {
        path: 'study-plans',
        label: 'Planes de estudio',
        icon: 'list-checks',
        description: 'Qué se estudia en cada nivel y en qué año escolar.',
      },
      {
        path: 'subjects',
        label: 'Asignaturas',
        icon: 'book-open',
        description: 'Las materias que imparte tu colegio. Los planes de estudio y los cursos se arman a partir de ellas.',
      },
      {
        path: 'courses',
        label: 'Cursos',
        icon: 'graduation-cap',
        description: 'Cada asignatura dentro de un plan de estudio, con su docente.',
      },
      {
        path: 'class-groups',
        label: 'Grupos',
        icon: 'users',
        description: 'Los grupos de alumnos de cada plan de estudio y su docente consejero.',
      },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      {
        path: 'parents',
        label: 'Padres y acudientes',
        icon: 'users-round',
        description: 'Las familias vinculadas a tus alumnos.',
      },
      {
        path: 'join-requests',
        label: 'Solicitudes de ingreso',
        icon: 'user-round-plus',
        description: 'Las personas que piden unirse a tu colegio, a la espera de tu aprobación.',
      },
      {
        path: 'imports',
        label: 'Carga masiva',
        icon: 'file-up',
        description: 'Da de alta alumnos y familias en bloque desde un archivo CSV.',
        permission: 'MANAGE_STUDENTS',
      },
    ],
  },
  {
    title: 'Operación',
    items: [
      {
        path: 'attendance-reporting',
        label: 'Asistencia',
        icon: 'clipboard-check',
        description: 'Indicadores de asistencia por curso y nivel.',
      },
      {
        path: 'events-calendar',
        label: 'Calendario de eventos',
        icon: 'calendar-days',
        description: 'Los eventos escolares y las fechas importantes.',
      },
    ],
  },
];

/** The section a `/admin/...` URL belongs to: its first segment after `/admin`, '' for the overview. */
export function adminSectionPath(url: string): string {
  const path = url.split(/[?#]/)[0];
  const match = /^\/admin(?:\/([^/]+))?/.exec(path);
  return match?.[1] ?? '';
}

/** The rail entry for a section path, with the group it belongs to. */
export function findAdminNavItem(path: string): { group: AdminNavGroup; item: AdminNavItem } | undefined {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((i) => i.path === path);
    if (item) return { group, item };
  }
  return undefined;
}
