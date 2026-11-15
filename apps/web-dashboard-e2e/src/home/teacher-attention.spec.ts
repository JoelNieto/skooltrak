import { expect, Page, test } from '@playwright/test';
import { data, personas, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S03 — teacher home: students needing attention (against the study plan's pass mark),
 * unanswered family messages, the average tile and the grade-distribution placeholder.
 * docs/product/slices/HOM-001-S03-teacher-attention.md
 *
 * Fixtures: the 7° plan uses `data.metric` (pass 3.0 / 5.0); in `data.publishedGrade` the second
 * related student scored 2.0. `data.familyThread` ends with a message from `personas.parent`.
 */

const lowStudent = `${data.relatedStudents[1]} E2E`;
const parentName = `${personas.parent.firstName} ${personas.parent.lastName}`;

function region(page: Page, name: string) {
  return page.getByRole('region', { name });
}

test.describe('Teacher home — attention and family messages', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: storageStatePath('teacher') });

  test('lists the student below the pass mark of their study plan @FR-HOM-001.10 @FR-HOM-001.2', async ({ page }) => {
    await page.goto('/home');

    const attention = region(page, 'Necesitan atención');
    const row = attention.getByRole('link', { name: new RegExp(lowStudent) });
    await expect(row).toContainText(`${data.courses.teacherOwn.name} 2.0`);
    // The others are above the pass mark; the unpublished grade doesn't count.
    for (const name of [data.relatedStudents[0], data.relatedStudents[2]]) {
      await expect(attention.getByText(`${name} E2E`)).toHaveCount(0);
    }

    const tile = page.locator('lib-stat-card', { hasText: 'Promedio de mis cursos' });
    await expect(tile).toContainText('3.5 / 5.0');
    await expect(tile).toContainText('1 estudiante bajo la nota mínima');

    await expect(page.getByRole('img', { name: /Gráfico por desarrollar: Histograma/ })).toBeVisible();
  });

  test('shows the unanswered family message until the teacher replies @FR-HOM-001.11 @FR-HOM-001.8', async ({
    page,
    request,
  }) => {
    await page.goto('/home');
    const family = region(page, 'Mensajes de acudientes');
    await expect(family.getByText(parentName)).toBeVisible();
    await expect(family.getByText(data.familyThread.parentMessage)).toBeVisible();
    await expect(region(page, 'Pendientes').getByText('Responder 1 mensaje')).toBeVisible();
    await expect(page.locator('lib-stat-card', { hasText: 'Mensajes de acudientes' })).toContainText('1');

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const headers = { Authorization: `Bearer ${token}` };
    const threads = (await (await request.get('/api/v1/communication/threads', { headers })).json()) as {
      id: string;
      title: string;
    }[];
    const thread = threads.find((t) => t.title === data.familyThread.title);
    expect(thread).toBeTruthy();
    const reply = await request.post(`/api/v1/communication/threads/${thread?.id}/messages`, {
      headers,
      data: { body: 'Claro, ¿le parece el jueves a las 3?' },
    });
    expect(reply.ok()).toBeTruthy();

    await page.goto('/home');
    await expect(region(page, 'Mensajes de acudientes').getByText('Sin mensajes por responder')).toBeVisible();
    await expect(region(page, 'Pendientes').getByText(/Responder \d+ mensaje/)).toHaveCount(0);
  });
});
