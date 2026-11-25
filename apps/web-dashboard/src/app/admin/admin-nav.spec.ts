import { ADMIN_NAV, adminSectionPath, findAdminNavItem } from './admin-nav';

describe('admin nav', () => {
  it('reads the section from an /admin URL', () => {
    expect(adminSectionPath('/admin')).toBe('');
    expect(adminSectionPath('/admin?tab=1')).toBe('');
    expect(adminSectionPath('/admin/subjects')).toBe('subjects');
    expect(adminSectionPath('/admin/subjects?page=2#top')).toBe('subjects');
    expect(adminSectionPath('/admin/courses/123')).toBe('courses');
  });

  it('finds an entry with its group', () => {
    expect(findAdminNavItem('subjects')?.group.title).toBe('Estructura académica');
    expect(findAdminNavItem('')?.item.label).toBe('Resumen');
    expect(findAdminNavItem('nope')).toBeUndefined();
  });

  it('has unique paths', () => {
    const paths = ADMIN_NAV.flatMap((g) => g.items.map((i) => i.path));
    expect(new Set(paths).size).toBe(paths.length);
  });
});
