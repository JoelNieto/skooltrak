import { Gradebook, GradebookStatus } from './entities/gradebook.entity';

/**
 * FR-ASM-001.13: the CSV of one gradebook view (course, period, group), as saved. One row per
 * student: name, cédula, one column per grade, the average and the status. Excused cells are `EX`
 * (BR .3), empty ones blank. Built on demand and never stored (FRD §8).
 */

const STATUS: Record<GradebookStatus, string> = { AT_RISK: 'En riesgo', WATCH: 'Atención', ON_TRACK: 'Al día' };

const oneDecimal = (n: number | null) => (n === null ? '' : (Math.round(n * 10) / 10).toFixed(1));

/** RFC 4180 quoting; a leading =, +, - or @ is prefixed with ' so spreadsheets don't run it as a formula. */
export function csvField(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function gradebookCsv(book: Pick<Gradebook, 'buckets' | 'rows'>): string {
  const columns = book.buckets.flatMap((b) => b.columns);
  const header = ['Estudiante', 'Cédula', ...columns.map((c) => c.title), 'Promedio', 'Estado'];
  const lines = book.rows.map((row) => [
    row.student.name,
    row.student.documentId,
    ...row.cells.map((cell) => (cell.excused ? 'EX' : oneDecimal(cell.score))),
    oneDecimal(row.average),
    row.status ? STATUS[row.status] : '',
  ]);
  return [header, ...lines].map((fields) => fields.map(csvField).join(',')).join('\r\n') + '\r\n';
}

/** A file name from the view: `calificaciones-matematicas-7-trimestre-1-7a.csv`. */
export function gradebookCsvName(parts: (string | null | undefined)[]): string {
  const slug = parts
    .filter((p): p is string => !!p)
    .map((p) =>
      p
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('-');
  return `calificaciones${slug ? `-${slug}` : ''}.csv`;
}
