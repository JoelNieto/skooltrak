import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ACA-001-S11: a student imported by CSV is on the rosters of their group's study plan, as a student
 * created by hand is (FR-ACA-001.20, BR-ACA-001.15). The student is imported into `related` (7°),
 * whose plan holds `teacher`'s course, so the teacher sees them when taking attendance and on the
 * submissions of the course's assignment.
 * docs/product/slices/ACA-001-S11-course-roster.md
 *
 * Runs in the `after` project (playwright.config.ts): it adds an active student to the organization,
 * which would change counts other specs assert. The student is deleted again afterwards.
 */

const STUDENT = { firstName: 'Iris', fatherName: 'Importada' };
const FULL_NAME = `${STUDENT.firstName} ${STUDENT.fatherName}`;
// Unique per run: an existing document id makes the import an UPDATE, which never syncs the roster.
const DOCUMENT_ID = `E2E-IMP-${Date.now()}`;

type Bearer = { Authorization: string };

async function bearerFor(request: APIRequestContext, email: string): Promise<Bearer> {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

async function teacherCourseId(request: APIRequestContext, headers: Bearer) {
  const res = await request.get('/api/v1/courses', {
    headers,
    params: { search: data.courses.teacherOwn.name, pageSize: 10 },
  });
  const course = ((await res.json()) as { data: { id: string; name: string }[] }).data.find(
    (c) => c.name === data.courses.teacherOwn.name,
  );
  if (!course) throw new Error(`course "${data.courses.teacherOwn.name}" not seeded`);
  return course.id;
}

test.describe('Course roster: students imported by CSV @FR-ACA-001.20', () => {
  test.describe.configure({ mode: 'serial' });

  let admin: Bearer;
  let courseId: string;
  let studentId: string | undefined;

  test.beforeAll(async ({ request }) => {
    admin = await bearerFor(request, personas.admin.email);
    courseId = await teacherCourseId(request, admin);

    // A run that failed before afterAll leaves its student behind, and the dialog would then list
    // the name more than once. Remove students imported by earlier runs first.
    const enrolled = (await (
      await request.get(`/api/v1/students/by-course/${courseId}`, { headers: admin })
    ).json()) as { id: string; documentId: string }[];
    for (const leftover of enrolled.filter((s) => s.documentId.startsWith('E2E-IMP-'))) {
      await request.delete(`/api/v1/students/${leftover.id}`, { headers: admin });
    }

    const schools = (await (await request.get('/api/v1/schools', { headers: admin })).json()) as {
      id: string;
      name: string;
      organizationId: string;
    }[];
    const school = schools.find((s) => s.name === data.school);
    if (!school) throw new Error(`school "${data.school}" not seeded`);

    const csvText = [
      'firstName,middleName,fatherName,motherName,documentId,birthDate,gender,address,phone,classGroupName',
      `${STUDENT.firstName},Ana,${STUDENT.fatherName},Ruiz,${DOCUMENT_ID},2013-05-01,FEMENINO,Calle 1,000-0000,${data.classGroups.related}`,
    ].join('\n');
    const dryRun = await request.post('/api/v1/imports/dry-run', {
      headers: admin,
      data: { organizationId: school.organizationId, schoolId: school.id, entityType: 'STUDENT', csvText },
    });
    expect(dryRun.ok()).toBeTruthy();
    const { jobId, validRows } = (await dryRun.json()) as { jobId: string; validRows: number };
    expect(validRows).toBe(1);

    const commit = await request.post(`/api/v1/imports/${jobId}/commit`, { headers: admin });
    expect(commit.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (studentId) await request.delete(`/api/v1/students/${studentId}`, { headers: admin });
  });

  test('the teacher sees the imported student when taking attendance for the course @FR-ACA-001.20', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: storageStatePath('teacher') });
    const page = await context.newPage();
    const students = page.waitForResponse((r) => r.url().includes('/api/v1/attendance/students'));

    await page.goto(`/courses/${courseId}`);
    await page.getByRole('tab', { name: 'Asistencia' }).click();
    await page.getByRole('button', { name: 'Nueva asistencia' }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.locator('#classGroupId').selectOption({ label: data.classGroups.related });

    const listed = (await (await students).json()) as { id: string; firstName: string; documentId: string }[];
    studentId = listed.find((s) => s.documentId === DOCUMENT_ID)?.id;
    expect(studentId).toBeTruthy();
    await expect(dialog.getByText(FULL_NAME)).toBeVisible();
    for (const name of data.relatedStudents) {
      await expect(dialog.getByText(`${name} E2E`)).toBeVisible(); // hand-created students are still there
    }

    await dialog.getByRole('button', { name: 'Cancelar' }).click(); // nothing is saved
    await context.close();
  });

  test("the imported student is listed on the submissions of the course's assignment @FR-ACA-001.20", async ({
    request,
  }) => {
    const teacher = await bearerFor(request, personas.teacher.email);
    const assignments = (await (
      await request.get('/api/v1/assignments/by-course', {
        headers: teacher,
        params: { courseId, startDate: '2000-01-01', endDate: '2100-01-01' },
      })
    ).json()) as { id: string; title: string }[];
    const assignment = assignments.find((a) => a.title === data.assignment.title);
    if (!assignment) throw new Error(`assignment "${data.assignment.title}" not seeded`);

    const res = await request.get(`/api/v1/assignment-submissions/students-for-assignment/${assignment.id}`, {
      headers: teacher,
    });
    expect(res.ok()).toBeTruthy();
    const rows = (await res.json()) as { documentId: string }[];
    expect(rows.some((r) => r.documentId === DOCUMENT_ID)).toBe(true);
  });
});
