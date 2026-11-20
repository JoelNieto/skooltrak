import { APIRequestContext, expect, test } from '@playwright/test';
import { data, E2E_PASSWORD, personas, storageStatePath } from '../support/fixtures';

/**
 * ASM-001-S01: grade endpoints check permission, organization and ownership (BR-ASM-001.13).
 * Uses the HOM-001 dataset: `teacher`'s course has the published `publishedGrade` scored for the
 * three related students (Ana, Beto, Carla) and the draft `grade`. `student` is Ana; `parent` is
 * linked to Ana and Beto only. Nothing here changes a score other specs rely on.
 */

type Row = { id: string; studentId: string; score: string | number | null; student?: { firstName: string } };
type Column = { id: string; title: string; published: boolean; studentGrades: Row[] };

async function bearerFor(request: APIRequestContext, email: string) {
  const res = await request.post('/api/v1/auth/login', { data: { email, password: E2E_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return { Authorization: `Bearer ${((await res.json()) as { accessToken: string }).accessToken}` };
}

/** The teacher's course, its two grade columns and the related students' rows, as the teacher sees them. */
async function loadCourse(request: APIRequestContext) {
  const teacher = await bearerFor(request, personas.teacher.email);
  const audiences = (await (
    await request.get('/api/v1/communication/broadcasts/audiences', { headers: teacher })
  ).json()) as { courses: { id: string; name: string }[] };
  const courseId = audiences.courses.find((c) => c.name === data.courses.teacherOwn.name)?.id;
  expect(courseId).toBeTruthy();

  const columns = (await (
    await request.get(`/api/v1/grades/by-course/${courseId}`, { headers: teacher })
  ).json()) as Column[];
  const published = columns.find((g) => g.title === data.publishedGrade.title);
  const draft = columns.find((g) => g.title === data.grade.title);
  expect(published?.published).toBe(true);
  expect(draft?.published).toBe(false);

  const row = (name: string) => {
    const found = published?.studentGrades.find((sg) => sg.student?.firstName === name);
    expect(found, `row for ${name}`).toBeTruthy();
    return found as Row;
  };
  const [ana, beto, carla] = data.relatedStudents.map(row);
  return { teacher, courseId: courseId as string, published: published as Column, draft: draft as Column, ana, beto, carla };
}

test.describe('Grade endpoints are scoped @FR-ASM-001.15', () => {
  test('a student cannot change a score', async ({ request }) => {
    const { teacher, courseId, beto } = await loadCourse(request);
    const student = await bearerFor(request, personas.student.email);

    const res = await request.patch('/api/v1/student-grades', {
      headers: student,
      data: { id: beto.id, score: 5 },
    });
    expect(res.status()).toBe(403);

    const after = (await (
      await request.get(`/api/v1/grades/by-course/${courseId}`, { headers: teacher })
    ).json()) as Column[];
    const betoAfter = after.flatMap((g) => g.studentGrades).find((sg) => sg.id === beto.id);
    expect(Number(betoAfter?.score)).toBe(Number(beto.score));
  });

  test('a student reads only their own published grades', async ({ request }) => {
    const { courseId, ana, beto } = await loadCourse(request);
    const student = await bearerFor(request, personas.student.email);

    const classmate = await request.get(`/api/v1/student-grades/by-course/${courseId}`, {
      headers: student,
      params: { studentId: beto.studentId },
    });
    expect(classmate.status()).toBe(403);

    const own = (await (
      await request.get(`/api/v1/student-grades/by-course/${courseId}`, {
        headers: student,
        params: { studentId: ana.studentId },
      })
    ).json()) as Row[];
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((r) => r.studentId === ana.studentId)).toBe(true);

    const columns = (await (
      await request.get(`/api/v1/grades/by-course/${courseId}`, { headers: student })
    ).json()) as Column[];
    expect(columns.map((g) => g.title)).not.toContain(data.grade.title);
    expect(columns.flatMap((g) => g.studentGrades).every((sg) => sg.studentId === ana.studentId)).toBe(true);
  });

  test('a parent reads a linked child only', async ({ request }) => {
    const { courseId, ana, carla } = await loadCourse(request);
    const parent = await bearerFor(request, personas.parent.email);

    const linked = await request.get(`/api/v1/student-grades/by-course/${courseId}`, {
      headers: parent,
      params: { studentId: ana.studentId },
    });
    expect(linked.status()).toBe(200);

    const notLinked = await request.get(`/api/v1/student-grades/by-course/${courseId}`, {
      headers: parent,
      params: { studentId: carla.studentId },
    });
    expect(notLinked.status()).toBe(403);
  });

  test("another teacher cannot publish this course's grades", async ({ request }) => {
    const { teacher, courseId, draft } = await loadCourse(request);
    const other = await bearerFor(request, personas.otherTeacher.email);

    const res = await request.patch('/api/v1/grades', { headers: other, data: { id: draft.id, published: true } });
    expect(res.status()).toBe(403);

    const columns = (await (
      await request.get(`/api/v1/grades/by-course/${courseId}`, { headers: teacher })
    ).json()) as Column[];
    expect(columns.find((g) => g.id === draft.id)?.published).toBe(false);
  });

  test('the course teacher can grade but not unpublish (BR-ASM-001.9)', async ({ request }) => {
    const { teacher, published, ana } = await loadCourse(request);

    // Re-saving the same score proves the write is allowed without changing data other specs use.
    const save = await request.patch('/api/v1/student-grades', {
      headers: teacher,
      data: { id: ana.id, score: Number(ana.score) },
    });
    expect(save.status()).toBe(200);

    const unpublish = await request.patch('/api/v1/grades', {
      headers: teacher,
      data: { id: published.id, published: false },
    });
    expect(unpublish.status()).toBe(403);
    expect(((await unpublish.json()) as { message: string }).message).toBe(
      'Solo un administrador puede despublicar calificaciones',
    );
  });
});

test.describe('Students API: grades and enrollment codes @FR-ASM-001.15', () => {
  test("a student's grades reach the student, linked parents and staff only", async ({ request }) => {
    const { ana, beto, carla } = await loadCourse(request);
    const student = await bearerFor(request, personas.student.email);
    const parent = await bearerFor(request, personas.parent.email);
    const teacher = await bearerFor(request, personas.teacher.email);
    const other = await bearerFor(request, personas.otherTeacher.email);

    const status = async (headers: Record<string, string>, studentId: string) =>
      (await request.get(`/api/v1/students/${studentId}/grades`, { headers })).status();

    expect(await status(student, ana.studentId)).toBe(200);
    expect(await status(student, beto.studentId)).toBe(403);
    // Parents lacked VIEW_STUDENTS, so the parent progress page was refused before this change.
    expect(await status(parent, ana.studentId)).toBe(200);
    expect(await status(parent, carla.studentId)).toBe(403);
    expect(await status(teacher, carla.studentId)).toBe(200);
    expect(await status(other, carla.studentId)).toBe(403);
  });

  test('enrollment codes reach admins only', async ({ request }) => {
    const { ana } = await loadCourse(request);
    const teacher = await bearerFor(request, personas.teacher.email);
    const admin = await bearerFor(request, personas.admin.email);

    // Seeded students have no code yet: issue one the way the admin student page does.
    const issued = await request.post(`/api/v1/students/${ana.studentId}/enrollment-code/regenerate`, { headers: admin });
    expect(issued.status()).toBe(201);
    const { enrollmentCode } = (await issued.json()) as { enrollmentCode: string };
    expect(enrollmentCode).toMatch(/^[A-Z0-9]{4,}$/);

    const asAdmin = (await (await request.get(`/api/v1/students/${ana.studentId}`, { headers: admin })).json()) as {
      enrollmentCode?: string;
    };
    expect(asAdmin.enrollmentCode).toBe(enrollmentCode);

    const asTeacher = (await (await request.get(`/api/v1/students/${ana.studentId}`, { headers: teacher })).json()) as {
      enrollmentCode?: string;
    };
    expect(asTeacher).not.toHaveProperty('enrollmentCode');
    expect(
      (await request.get(`/api/v1/students/${ana.studentId}/enrollment-code`, { headers: teacher })).status(),
    ).toBe(403);

    const roster = (await (
      await request.get(`/api/v1/grades/by-course/${(await loadCourse(request)).courseId}`, { headers: teacher })
    ).json()) as { studentGrades: { student?: Record<string, unknown> }[] }[];
    for (const sg of roster.flatMap((g) => g.studentGrades)) {
      expect(sg.student).not.toHaveProperty('enrollmentCode');
    }
  });
});

test.describe('Teacher grade pages keep working @FR-ASM-001.15', () => {
  test.use({ storageState: storageStatePath('teacher') });

  test('the grade page lists the course students', async ({ page, request }) => {
    const { published } = await loadCourse(request);
    await page.goto(`/grades/${published.id}`);
    await expect(page.getByText(data.publishedGrade.title).first()).toBeVisible();
    for (const name of data.relatedStudents) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    }
  });
});
