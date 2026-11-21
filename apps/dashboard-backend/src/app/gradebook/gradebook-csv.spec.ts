import { csvField, gradebookCsv, gradebookCsvName } from './gradebook-csv';

/** ASM-001-S07 — the gradebook CSV (FR-ASM-001.13). */
const student = (name: string, documentId: string) => ({ id: name, firstName: name, name, documentId, initials: 'X', color: null });
const cell = (score: number | null, excused = false) => ({ gradeId: 'g', studentGradeId: null, score, excused, comment: null, updatedAt: null });

describe('gradebookCsv', () => {
  it('writes one row per student: cédula, scores, EX, average and status @FR-ASM-001.13', () => {
    const csv = gradebookCsv({
      buckets: [
        {
          id: 'b',
          name: 'Pruebas',
          weight: 100,
          columns: [
            { id: 'g1', title: 'Taller, parte 1', date: '', published: true, publishedAt: null, assignment: null },
            { id: 'g2', title: 'Prueba "corta"', date: '', published: false, publishedAt: null, assignment: null },
          ],
        },
      ],
      rows: [
        { student: student('Ana Pérez', '8-123-456'), cells: [cell(4), cell(4.25)], average: 4.125, status: 'ON_TRACK' },
        { student: student('Beto Ruiz', '8-222-333'), cells: [cell(2), cell(null, true)], average: 2, status: 'AT_RISK' },
        { student: student('Dani Gil', '8-999-000'), cells: [cell(null), cell(null)], average: null, status: null },
      ],
    });
    expect(csv.split('\r\n')).toEqual([
      'Estudiante,Cédula,"Taller, parte 1","Prueba ""corta""",Promedio,Estado',
      'Ana Pérez,8-123-456,4.0,4.3,4.1,Al día',
      'Beto Ruiz,8-222-333,2.0,EX,2.0,En riesgo',
      'Dani Gil,8-999-000,,,,',
      '',
    ]);
  });

  it("neutralises values a spreadsheet would run as a formula", () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('-2')).toBe("'-2");
  });

  it('names the file after the course, period and group', () => {
    expect(gradebookCsvName(['Matemáticas 7° E2E', 'Periodo E2E', '7°A E2E'])).toBe(
      'calificaciones-matematicas-7-e2e-periodo-e2e-7-a-e2e.csv',
    );
    expect(gradebookCsvName(['Ciencias', null, undefined])).toBe('calificaciones-ciencias.csv');
  });
});
