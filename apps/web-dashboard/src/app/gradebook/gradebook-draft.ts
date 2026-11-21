import { courseAverage, formatScore, gradeStatus, GradeStatus, meanOf, parseCell } from '@/shared';
import type { Gradebook } from './gradebook-grid';

/**
 * Unsaved cells of one gradebook view (ASM-001-S03): what the teacher typed, keyed by
 * `gradeId|studentId`, with the `updatedAt` the cell had when it was loaded (BR-ASM-001.7).
 */
export interface CellEdit {
  text: string;
  updatedAt: string | null;
}
export type Edits = Record<string, CellEdit>;

export const cellKey = (gradeId: string, studentId: string) => `${gradeId}|${studentId}`;

/** One view = course, period and group; unsaved cells are kept per view (FRD §8). */
export const viewKey = (book: Pick<Gradebook, 'course' | 'periodId' | 'classGroupId'>) =>
  `${book.course.id}:${book.periodId ?? '-'}:${book.classGroupId ?? 'none'}`;

/** What an input shows for a saved score. */
export const savedText = (score: number | null) => (score === null ? '' : formatScore(score));

export interface ViewCell {
  key: string;
  gradeId: string;
  /** The column is a draft and the course has a scale: the cell is an input (published ones wait for S04). */
  editable: boolean;
  text: string;
  /** Score counted in the averages: the typed one when valid, else the saved one. */
  score: number | null;
  changed: boolean;
  error: string | null;
}

export interface ViewRow {
  student: Gradebook['rows'][number]['student'];
  cells: ViewCell[];
  average: number | null;
  status: GradeStatus | null;
}

export interface GradebookView {
  rows: ViewRow[];
  footer: { columns: (number | null)[]; average: number | null };
  includesDrafts: boolean;
  changed: number;
  invalid: number;
}

/** The grid with the teacher's unsaved values applied (FR-ASM-001.5): averages, status, footer. */
export function applyEdits(book: Gradebook, edits: Edits): GradebookView {
  const columns = book.buckets.flatMap((b) => b.columns.map((c) => ({ ...c, bucketId: b.id, weight: b.weight })));
  let changed = 0;
  let invalid = 0;

  const rows = book.rows.map((row) => {
    const cells = columns.map((column, i): ViewCell => {
      const saved = row.cells[i];
      const key = cellKey(column.id, row.student.id);
      const editable = !!book.metric && !column.published;
      const edit = editable ? edits[key] : undefined;
      if (!edit) {
        return { key, gradeId: column.id, editable, text: savedText(saved.score), score: saved.score, changed: false, error: null };
      }
      const parsed = parseCell(edit.text, book.metric ?? { minimum: 0, maximum: 0 });
      if (parsed.error) {
        invalid += 1;
        return { key, gradeId: column.id, editable, text: edit.text, score: saved.score, changed: true, error: parsed.error };
      }
      const isChange = parsed.score !== saved.score;
      if (isChange) changed += 1;
      return { key, gradeId: column.id, editable, text: edit.text, score: parsed.score, changed: isChange, error: null };
    });
    const average = courseAverage(columns.map((c, i) => ({ bucketId: c.bucketId, weight: c.weight, score: cells[i].score })));
    return { student: row.student, cells, average, status: gradeStatus(average, book.metric?.minimumApproval) };
  });

  return {
    rows,
    footer: {
      columns: columns.map((_, i) => meanOf(rows.map((r) => r.cells[i].score))),
      average: meanOf(rows.map((r) => r.average)),
    },
    includesDrafts: columns.some((c, i) => !c.published && rows.some((r) => r.cells[i].score !== null)),
    changed,
    invalid,
  };
}

/** The cells a save sends: valid changes only (the bar blocks saving while any is invalid). */
export function changedCells(book: Gradebook, edits: Edits) {
  const view = applyEdits(book, edits);
  return view.rows.flatMap((row) =>
    row.cells
      .filter((cell) => cell.changed && !cell.error)
      .map((cell) => ({
        gradeId: cell.gradeId,
        studentId: row.student.id,
        score: cell.score,
        updatedAt: edits[cell.key]?.updatedAt ?? null,
      })),
  );
}

// ── Local backup (FRD §8) ────────────────────────────────────────────────────────────────────
// Per-viewer convenience only: storage can be missing or throw (private mode), so every access is
// guarded and the grid works without it.
const STORAGE_PREFIX = 'skooltrak:gradebook-draft:';

export function readBackup(key: string): Edits | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_PREFIX + key);
    const parsed = raw ? (JSON.parse(raw) as Edits) : null;
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length ? parsed : null;
  } catch {
    return null;
  }
}

export function writeBackup(key: string, edits: Edits): void {
  try {
    if (Object.keys(edits).length) globalThis.localStorage?.setItem(STORAGE_PREFIX + key, JSON.stringify(edits));
    else globalThis.localStorage?.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Storage unavailable: the draft just isn't kept across reloads.
  }
}
