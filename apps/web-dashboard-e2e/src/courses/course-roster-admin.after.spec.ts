import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S12: an admin manages a course's roster (FR-ACA-001.19, BR-ACA-001.15) on
 * `otherTeachers`' course (Ciencias 8°), so the rosters of `teacher`'s course that other specs
 * count stay untouched:
 * - Beto (7°, outside the 8° plan) is added as an elective ("Agregado"), then removed;
 * - a student created here in 8°A is on the roster by plan ("Plan de estudio"), is excluded, and
 *   restored. They are deleted afterwards.
 * Runs in the `after` project: it adds an active student to the organization.
 * docs/product/slices/ACA-001-S12-course-roster-admin.md
 */

test.describe.configure({ mode: 'serial' });

type Bearer = { Authorization: string };
type Entry = { student: { id: string; name: string }; source: 'PLAN' | 'MANUAL'; excluded: boolean };

const PLAN_STUDENT = { firstName: 'Olivia', fatherName: 'Plan' };
const PLAN_NAME = `${PLAN_STUDENT.firstName} ${PLAN_STUDENT.fatherName}`;

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Course roster managed by an admin @FR-ACA-001.19 @BR-ACA-001.15', () => {
  let admin: Bearer;
  let courseId: string;
  let planStudentId: string | undefined;
  let betoId: string;

  const roster = async (request: APIRequestContext) =>
    (await (await request.get(`/api/v1/courses/${courseId}/roster`, { headers: admin })).json()) as Entry[];

  test.beforeAll(async ({ request }) => {
    admin = await bearerFor(request, personas.admin.email);
    const courses = (await (
      await request.get('/api/v1/courses', { headers: admin, params: { search: data.courses.otherTeachers.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    courseId = courses.data.find((c) => c.name === data.courses.otherTeachers.name)?.id as string;

    const schools = (await (await request.get('/api/v1/schools', { headers: admin })).json()) as {
      id: string;
      name: string;
      organizationId: string;
    }[];
    const school = schools.find((s) => s.name === data.school);
    if (!school) throw new Error(`school "${data.school}" not seeded`);
    const groups = (await (
      await request.get('/api/v1/class-groups', { headers: admin, params: { schoolId: school.id, search: data.classGroups.homeroomOnly } })
    ).json()) as { data?: { id: string; name: string }[] } | { id: string; name: string }[];
    const list = Array.isArray(groups) ? groups : (groups.data ?? []);
    const group = list.find((g) => g.name === data.classGroups.homeroomOnly);
    if (!group) throw new Error(`class group "${data.classGroups.homeroomOnly}" not seeded`);

    // Leftovers from a run that failed before afterAll.
    for (const e of (await roster(request)).filter((e) => e.student.name === PLAN_NAME)) {
      await request.delete(`/api/v1/students/${e.student.id}`, { headers: admin });
    }
    const created = await request.post('/api/v1/students', {
      headers: admin,
      data: {
        ...PLAN_STUDENT,
        middleName: '',
        motherName: '',
        documentId: `E2E-PLAN-${Date.now()}`,
        organizationId: school.organizationId,
        schoolId: school.id,
        classGroupId: group.id,
        birthDate: '2012-05-01',
        gender: 'FEMALE',
        address: 'Calle 1',
        phone: '000-0000',
      },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    planStudentId = ((await created.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    if (betoId) await request.delete(`/api/v1/courses/${courseId}/roster/${betoId}`, { headers: admin });
    if (planStudentId) await request.delete(`/api/v1/students/${planStudentId}`, { headers: admin });
  });

  test('adds a student from outside the plan as an elective', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('admin') });
    const page = await context.newPage();
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('tab', { name: /Participantes/ }).click();
    await page.getByRole('button', { name: 'Gestionar estudiantes' }).click();
    const dialog = page.getByRole('dialog');

    const enrolled = dialog.getByRole('list', { name: 'Estudiantes del curso' });
    await expect(enrolled.getByRole('listitem').filter({ hasText: PLAN_NAME })).toContainText('Plan de estudio');

    await dialog.getByRole('searchbox', { name: 'Buscar estudiante para agregar' }).fill('Beto');
    const results = dialog.getByRole('list', { name: 'Resultados' });
    await results.getByRole('listitem').filter({ hasText: 'Beto' }).getByRole('button', { name: 'Agregar' }).click();
    await expect(enrolled.getByRole('listitem').filter({ hasText: 'Beto' })).toContainText('Agregado');
    await context.close();
  });

  test('removing a plan student excludes them, and they can be restored', async ({ browser, request }) => {
    const context = await browser.newContext({ storageState: storageStatePath('admin') });
    const page = await context.newPage();
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('tab', { name: /Participantes/ }).click();
    await page.getByRole('button', { name: 'Gestionar estudiantes' }).click();
    const enrolled = page.getByRole('dialog').getByRole('list', { name: 'Estudiantes del curso' });
    const row = enrolled.getByRole('listitem').filter({ hasText: PLAN_NAME });

    await row.getByRole('button', { name: `Quitar a ${PLAN_NAME}` }).click();
    await expect(row).toContainText('Excluido');
    // Excluded: gone from what everyone else sees (BR .15).
    const participants = (await (await request.get(`/api/v1/courses/${courseId}/participants`, { headers: admin })).json()) as {
      students: { name: string }[];
    };
    expect(participants.students.map((s) => s.name)).not.toContain(PLAN_NAME);

    await row.getByRole('button', { name: 'Restaurar' }).click();
    await expect(row).toContainText('Plan de estudio');
    await context.close();

    const entries = await roster(request);
    betoId = entries.find((e) => e.student.name.startsWith('Beto'))?.student.id as string;
    expect(entries.find((e) => e.student.name === PLAN_NAME)).toEqual(expect.objectContaining({ source: 'PLAN', excluded: false }));
  });

  test('removing a manual enrollment deletes it; teachers cannot manage the roster', async ({ request }) => {
    expect((await request.delete(`/api/v1/courses/${courseId}/roster/${betoId}`, { headers: admin })).ok()).toBeTruthy();
    expect((await roster(request)).some((e) => e.student.id === betoId)).toBe(false);
    betoId = '';

    const teacher = await bearerFor(request, personas.otherTeacher.email);
    expect((await request.get(`/api/v1/courses/${courseId}/roster`, { headers: teacher })).status()).toBe(403);
    expect((await request.post(`/api/v1/courses/${courseId}/roster`, { headers: teacher, data: { studentId: planStudentId } })).status()).toBe(403);
  });
});
