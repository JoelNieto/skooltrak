import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S13: a homeroom teacher's read-only view of colleagues' courses (FR-ACA-001.18,
 * BR-ACA-001.16). `teacher` is homeroom teacher of 8°A, whose plan holds `otherTeachers`' course
 * (Ciencias 8°). A student is created in 8°A here, so the group has someone enrolled, and deleted
 * afterwards. Runs in the `after` project: it adds an active student to the organization. Other
 * `after` specs may add 8°A students too, so this one checks names, not counts.
 * docs/product/slices/ACA-001-S13-homeroom-view.md
 */

test.describe.configure({ mode: 'serial' });

type Bearer = { Authorization: string };

const STUDENT = { firstName: 'Hugo', fatherName: 'Consejero' };
const NAME = `${STUDENT.firstName} ${STUDENT.fatherName}`;

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

test.describe('Homeroom teacher read-only course view @FR-ACA-001.18 @BR-ACA-001.16', () => {
  let admin: Bearer;
  let teacher: Bearer;
  let courseId: string;
  let studentId: string | undefined;

  test.beforeAll(async ({ request }) => {
    admin = await bearerFor(request, personas.admin.email);
    teacher = await bearerFor(request, personas.teacher.email);
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
    const group = (Array.isArray(groups) ? groups : (groups.data ?? [])).find((g) => g.name === data.classGroups.homeroomOnly);
    if (!group) throw new Error(`class group "${data.classGroups.homeroomOnly}" not seeded`);

    const created = await request.post('/api/v1/students', {
      headers: admin,
      data: {
        ...STUDENT,
        middleName: '',
        motherName: '',
        documentId: `E2E-HR-${Date.now()}`,
        organizationId: school.organizationId,
        schoolId: school.id,
        classGroupId: group.id,
        birthDate: '2012-05-01',
        gender: 'MALE',
        address: 'Calle 1',
        phone: '000-0000',
      },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    studentId = ((await created.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    if (studentId) await request.delete(`/api/v1/students/${studentId}`, { headers: admin });
  });

  test('"Cursos de 8°A" lists the colleague\'s course, which opens read-only', async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();
    await page.goto('/courses');
    const section = page.getByRole('region', { name: `Cursos de ${data.classGroups.homeroomOnly}` });
    await section.getByRole('link', { name: /Ciencias/ }).click();
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}`));

    await expect(page.getByText('Vista de docente consejero')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Estudiante del grupo' })).toContainText(NAME);
    for (const tab of ['Resumen', 'Asignaciones', 'Calificaciones', 'Participantes', 'Recursos']) {
      await expect(page.getByRole('tab', { name: new RegExp(tab) })).toBeVisible();
    }
    // No write actions, no gradebook, attendance or weights (BR .16).
    for (const tab of ['Asistencia', 'Ponderación', 'Canales']) await expect(page.getByRole('tab', { name: new RegExp(tab) })).toHaveCount(0);
    // BR-ACA-001.19: a homeroom teacher is neither manager nor member of a colleague's course channels.
    await expect(page.getByRole('button', { name: 'Canal' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Canales' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Nueva asignaci/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Personalizar' })).toHaveCount(0);
    await expect(page.locator('app-gradebook-grid')).toHaveCount(0);

    await page.getByRole('tab', { name: /Recursos/ }).click();
    await expect(page.getByRole('button', { name: 'Subir archivos' })).toHaveCount(0);
    await context.close();
  });

  test("the API scopes the homeroom teacher to their group's students and refuses the gradebook", async ({ request }) => {
    const sections = (await (await request.get('/api/v1/courses/homeroom', { headers: teacher })).json()) as {
      group: { name: string };
      courses: { id: string }[];
    }[];
    expect(sections.find((s) => s.group.name === data.classGroups.homeroomOnly)?.courses.map((c) => c.id)).toContain(courseId);

    const course = (await (await request.get(`/api/v1/courses/${courseId}`, { headers: teacher })).json()) as {
      viewer: { kind: string };
      canCustomize: boolean;
    };
    expect(course.viewer.kind).toBe('HOMEROOM');
    expect(course.canCustomize).toBe(false);

    const work = await request.get(`/api/v1/courses/${courseId}/work`, { headers: teacher, params: { studentId: studentId as string } });
    expect(work.ok()).toBeTruthy();
    expect((await request.get(`/api/v1/gradebook/${courseId}`, { headers: teacher })).status()).toBe(403);

    // A student outside their homeroom group (Ana, 7°A) is refused, never swapped for another one.
    const math = (await (
      await request.get('/api/v1/courses', { headers: admin, params: { search: data.courses.teacherOwn.name, pageSize: 10 } })
    ).json()) as { data: { id: string; name: string }[] };
    const mathId = math.data.find((c) => c.name === data.courses.teacherOwn.name)?.id as string;
    const enrolled = (await (await request.get(`/api/v1/students/by-course/${mathId}`, { headers: admin })).json()) as {
      id: string;
      firstName: string;
    }[];
    const ana = enrolled.find((s) => s.firstName === 'Ana')?.id as string;
    expect((await request.get(`/api/v1/courses/${courseId}/work`, { headers: teacher, params: { studentId: ana } })).status()).toBe(403);

    const participants = (await (await request.get(`/api/v1/courses/${courseId}/participants`, { headers: teacher })).json()) as {
      students: { name: string }[];
    };
    expect(participants.students.map((s) => s.name)).toContain(NAME);
  });
});
