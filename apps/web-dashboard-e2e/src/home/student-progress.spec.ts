import { expect, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * HOM-001-S05 — student home: KPIs, per-course averages on the study plan's scale, recent grades,
 * habits and the progress chart placeholder (BR-HOM-001.1, .2).
 * docs/product/slices/HOM-001-S05-student-progress.md
 *
 * `student` is the first related student: their only published score is `data.publishedScores[0]`
 * (4.0) in `data.publishedGrade`; the unpublished `data.grade` (4.5) must not count. The 7° plan uses
 * `data.metric` (pass 3.0, excellence 4.5, max 5.0). Attendance and message counts depend on other
 * specs (attendance taken, broadcasts sent), so they are not asserted here.
 */

const course = data.courses.teacherOwn.name;
const score = data.publishedScores[0].toFixed(1);
const max = data.metric.maximum.toFixed(1);

test.describe('Student home — progress', () => {
  test.use({ storageState: storageStatePath('student') });

  test('shows course averages on the study plan scale with recent grades @FR-HOM-001.16 @FR-HOM-001.2', async ({ page }) => {
    await page.goto('/home');

    const grades = page.getByRole('region', { name: new RegExp(`Mis calificaciones · ${data.period.name}`) });
    await expect(grades.getByRole('listitem').filter({ hasText: course })).toContainText(score);
    await expect(grades.getByRole('progressbar', { name: `${course}: ${score} de ${max}` })).toBeVisible();
    await expect(grades.getByText(`Excelencia (${data.metric.minimumExcellence.toFixed(1)}+)`)).toBeVisible();
    await expect(grades.getByText(`Aprobado (${data.metric.minimumApproval.toFixed(1)}+)`)).toBeVisible();
    await expect(grades.getByText(`${course} · ${data.publishedGrade.title} · ${score}`)).toBeVisible();
    await expect(grades.getByText(data.grade.title)).toHaveCount(0); // unpublished
    await expect(grades.getByRole('link', { name: 'Ver informe completo' })).toBeVisible();
  });

  test('shows the KPI row, habits and the progress placeholder @FR-HOM-001.13 @FR-HOM-001.17', async ({ page }) => {
    await page.goto('/home');

    await expect(page.locator('lib-stat-card', { hasText: 'Promedio del periodo' })).toContainText(`${score} / ${max}`);
    const toDo = page.locator('lib-stat-card', { hasText: 'Por entregar' });
    await expect(toDo).toContainText('2'); // pending + overdue
    await expect(toDo).toContainText('1 vencida');
    await expect(page.locator('lib-stat-card', { hasText: 'Asistencia' })).toBeVisible();
    await expect(page.locator('lib-stat-card', { hasText: 'Mensajes nuevos' })).toBeVisible();

    const progress = page.getByRole('region', { name: 'Mi progreso' });
    await expect(progress.getByRole('img', { name: /Gráfico por desarrollar: Línea/ })).toBeVisible();
    await expect(progress.getByText('Aún no hay hábitos publicados en este periodo')).toBeVisible();
  });
});
