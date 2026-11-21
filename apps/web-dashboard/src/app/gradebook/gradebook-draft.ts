import { courseAverage, EXCUSED_TEXT, formatScore, gradeStatus, GradeStatus, meanOf, parseCell } from '@/shared';
import type { Gradebook } from './gradebook-grid';

/**
 * Unsaved cells of one gradebook view (ASM-001-S03, S04): what the teacher typed, keyed by
 * `gradeId|studentId`, with the `updatedAt` the cell had when it was loaded (BR-ASM-001.7).
 */
export interface CellEdit {
  /** The score as typed. */
  text: string;
  updatedAt: string | null;
  /** New comment (BR-ASM-001.14); undefined when not edited. */
  comment?: string;
  /** Reason for this cell only (BR-ASM-001.8); undefined uses the save's reason. */
  reason?: string;
}

/** BR-ASM-001.8: 3–300 characters once trimmed. */
export const isValidReason = (reason: string | null | undefined) => {
  const length = reason?.trim().length ?? 0;
  return length >= 3 && length <= 300;
};
export const COMMENT_MAX = 500;
export type Edits = Record<string, CellEdit>;

export const cellKey = (gradeId: string, studentId: string) => `${gradeId}|${studentId}`;

/** One view = course, period and group; unsaved cells are kept per view (FRD §8). */
export const viewKey = (book: Pick<Gradebook, 'course' | 'periodId' | 'classGroupId'>) =>
  `${book.course.id}:${book.periodId ?? '-'}:${book.classGroupId ?? 'none'}`;

/** What an input shows for a saved cell: its score, `EX` when excused (BR-ASM-001.3), else empty. */
export const savedText = (score: number | null, excused = false) => (excused ? EXCUSED_TEXT : score === null ? '' : formatScore(score));

export interface ViewCell {
  key: string;
  gradeId: string;
  studentGradeId: string | null;
  /** The course has a scale: the cell is an input. */
  editable: boolean;
  published: boolean;
  text: string;
  /** Score counted in the averages: the typed one when valid, else the saved one. */
  score: number | null;
  /** Excused (BR-ASM-001.3): no score, left out of the averages. */
  excused: boolean;
  comment: string;
  /** The score or the comment differs from the saved cell. */
  changed: boolean;
  /** A published score (or exemption) changes: the save needs a reason (BR-ASM-001.8). */
  needsReason: boolean;
  reason: string;
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
      const editable = !!book.metric;
      const edit = editable ? edits[key] : undefined;
      const base = {
        key,
        gradeId: column.id,
        studentGradeId: saved.studentGradeId,
        editable,
        published: column.published,
        comment: edit?.comment ?? saved.comment ?? '',
        reason: edit?.reason ?? '',
      };
      if (!edit) {
        return {
          ...base,
          text: savedText(saved.score, saved.excused),
          score: saved.score,
          excused: saved.excused,
          changed: false,
          needsReason: false,
          error: null,
        };
      }
      const commentError = (edit.comment?.length ?? 0) > COMMENT_MAX ? `Máximo ${COMMENT_MAX} caracteres en el comentario` : null;
      const parsed = parseCell(edit.text, book.metric ?? { minimum: 0, maximum: 0 });
      if (parsed.error || commentError) {
        invalid += 1;
        return {
          ...base,
          text: edit.text,
          score: saved.score,
          excused: saved.excused,
          changed: true,
          needsReason: false,
          error: parsed.error ?? commentError,
        };
      }
      const scoreChange = parsed.score !== saved.score || parsed.excused !== saved.excused;
      const commentChange = edit.comment !== undefined && (edit.comment || null) !== (saved.comment || null);
      const isChange = scoreChange || commentChange;
      if (isChange) changed += 1;
      return {
        ...base,
        text: edit.text,
        score: parsed.score,
        excused: parsed.excused,
        changed: isChange,
        needsReason: column.published && scoreChange,
        error: null,
      };
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
      .map((cell) => {
        const edit = edits[cell.key];
        return {
          gradeId: cell.gradeId,
          studentId: row.student.id,
          score: cell.score,
          ...(cell.excused ? { excused: true } : {}),
          updatedAt: edit?.updatedAt ?? null,
          ...(edit?.comment !== undefined ? { comment: edit.comment } : {}),
          ...(cell.needsReason && isValidReason(edit?.reason) ? { reason: edit?.reason?.trim() } : {}),
        };
      }),
  );
}

/** Changed published scores that still lack their own reason: the save asks for one covering them. */
export function cellsNeedingReason(view: GradebookView): ViewCell[] {
  return view.rows.flatMap((row) => row.cells.filter((cell) => cell.needsReason && !isValidReason(cell.reason)));
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
