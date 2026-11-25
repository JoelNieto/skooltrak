import type { ChannelSummary } from '@/shared';

/**
 * Who is looking: a member's audience type decides whether they may reply (BR-ACA-001.18); a manager
 * (the course's teacher or an admin, FR-ACA-001.27) sees whether anyone may.
 */
export type ChannelViewer = 'STUDENT' | 'PARENT' | 'MANAGER';

export interface CourseChannel extends ChannelSummary {
  /** BR-ACA-001.18, from the viewer's side. */
  kind: string;
}

/** "04/12/2026", in the viewer's time zone. */
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });

/**
 * BR-ACA-001.18: "Solo anuncios", "Conversación del curso" or "Preguntas al docente". An assignment's
 * Q&A channel (FR-ACA-001.29) says when it closes instead: "Cierra el 04/12/2026" or "Preguntas cerradas".
 */
export function channelKind(channel: ChannelSummary, viewer: ChannelViewer): string {
  if (channel.scope === 'ASSIGNMENT') {
    if (channel.archived) return 'Preguntas cerradas';
    return channel.closesAt ? `Cierra el ${shortDate(channel.closesAt)}` : 'Preguntas de la asignación';
  }
  const canReply =
    viewer === 'STUDENT'
      ? channel.studentsCanReply
      : viewer === 'PARENT'
        ? channel.parentsCanReply
        : channel.studentsCanReply || channel.parentsCanReply;
  if (!canReply) return 'Solo anuncios';
  return channel.replyVisibility === 'PUBLIC' ? 'Conversación del curso' : 'Preguntas al docente';
}

/**
 * BR-ACA-001.17: the course's channels out of the caller's channel list (COM-003): the COURSE level and
 * its assignments' Q&A channels (ASSIGNMENT, FR-ACA-001.29), for this course only. Open channels come
 * first, by latest post; archived or closed ones last (FR-ACA-001.21).
 */
export function courseChannels(
  list: readonly ChannelSummary[],
  courseId: string,
  viewer: ChannelViewer,
): CourseChannel[] {
  return list
    .filter((c) => (c.scope === 'COURSE' || c.scope === 'ASSIGNMENT') && c.courseId === courseId)
    .sort((a, b) => Number(a.archived) - Number(b.archived) || (b.lastPostAt ?? '').localeCompare(a.lastPostAt ?? ''))
    .map((c) => ({ ...c, kind: channelKind(c, viewer) }));
}

/** FR-ACA-001.28: replies waiting for a manager across the course's open channels (BR-COM-003.12). */
export function toAnswerTotal(channels: readonly CourseChannel[]): number {
  return channels.reduce((sum, c) => sum + (c.archived ? 0 : c.toAnswer), 0);
}

/** FR-ACA-001.29: the list's two groups, "Canales del curso" and "Preguntas por asignación", each kept in order. */
export function groupChannels(channels: readonly CourseChannel[]): {
  course: CourseChannel[];
  assignments: CourseChannel[];
} {
  return {
    course: channels.filter((c) => c.scope !== 'ASSIGNMENT'),
    assignments: channels.filter((c) => c.scope === 'ASSIGNMENT'),
  };
}

/** FR-ACA-001.21: "1 nuevo" / "3 nuevos". */
export function newCount(n: number): string {
  return n === 1 ? '1 nuevo' : `${n} nuevos`;
}

/**
 * FR-ACA-001.23, .24: unread posts per course, from the caller's channel list (BR-ACA-001.17): its
 * COURSE channels and its assignments' Q&A channels (S22, decided 2026-11-25), as the Canales tab
 * counts them. Archived or closed ones don't count. Courses with nothing unread are left out.
 */
export function unreadByCourse(list: readonly ChannelSummary[]): Map<string, number> {
  const byCourse = new Map<string, number>();
  for (const c of list) {
    if ((c.scope !== 'COURSE' && c.scope !== 'ASSIGNMENT') || !c.courseId || c.archived || !c.unread) continue;
    byCourse.set(c.courseId, (byCourse.get(c.courseId) ?? 0) + c.unread);
  }
  return byCourse;
}

/** FR-ACA-001.23: "1 mensaje nuevo." / "3 mensajes nuevos." for a card's accessible name. */
export function newMessages(n: number): string {
  return n === 1 ? '1 mensaje nuevo.' : `${n} mensajes nuevos.`;
}

/**
 * FR-ACA-001.25 (Q9 (a)): where "Preguntar en el curso" goes. The course's open channels where the
 * viewer may reply: a *Conversación del curso* (public replies) first, else a *Preguntas al docente*
 * (private replies, seen only by the course's managers), BR-ACA-001.18. Among several of a kind, the
 * one with the latest post: `channels` comes sorted from `courseChannels`. Null hides the button.
 */
export function askChannel(channels: readonly CourseChannel[]): CourseChannel | null {
  // An assignment's Q&A channel is for that assignment, not the course's general questions.
  const open = channels.filter((c) => !c.archived && c.scope === 'COURSE');
  return (
    open.find((c) => c.kind === 'Conversación del curso') ?? open.find((c) => c.kind === 'Preguntas al docente') ?? null
  );
}

/**
 * FR-ACA-001.26: the channel open beside the list: the one in the URL when it is one of the course's
 * channels (BR-ACA-001.17), else none. Nothing opens by itself, because opening marks posts read and
 * would count in the teacher's "Leído por" for posts the viewer never chose to read.
 */
export function openChannelId(channels: readonly CourseChannel[], wanted: string | null | undefined): string | null {
  return wanted && channels.some((c) => c.id === wanted) ? wanted : null;
}

/** `GET /api/v1/assignments/:id`, as the Q&A channel's assignment card reads it (FR-ACA-001.29). */
export interface ChannelAssignment {
  id: string;
  title: string;
  type: string;
  /** Students and parents get their group's date only; staff get every group's. */
  dates: { date: string; classGroup?: { name: string } | null }[];
}

/**
 * FR-ACA-001.29: "Entrega: 04/12/2026" for one date, else one per group, soonest first:
 * "Entregas: 7°A 01/12/2026 · 7°B 04/12/2026". No dates: "Sin fecha de entrega".
 */
export function assignmentDueText(dates: ChannelAssignment['dates']): string {
  if (!dates.length) return 'Sin fecha de entrega';
  const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 1) return `Entrega: ${shortDate(sorted[0].date)}`;
  return `Entregas: ${sorted.map((d) => `${d.classGroup?.name ?? '—'} ${shortDate(d.date)}`).join(' · ')}`;
}
