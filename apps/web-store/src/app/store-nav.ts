import { SchoolContext } from '#/shared';

/** Base URL segments for the current school store: `['/store', slug]` or `['/store']` if no slug. */
export function storeBaseSegments(school: SchoolContext): string[] {
  const slug = school.currentSchoolSlug();
  return slug ? ['/store', slug] : ['/store'];
}
