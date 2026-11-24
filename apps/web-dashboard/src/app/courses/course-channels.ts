import type { ChannelSummary } from '@/shared';

/** Who is looking: their audience type decides whether they may reply (BR-ACA-001.18). */
export type ChannelViewer = 'STUDENT' | 'PARENT';

export interface CourseChannel extends ChannelSummary {
  /** BR-ACA-001.18, from the viewer's side. */
  kind: string;
}

/** BR-ACA-001.18: "Solo anuncios", "Conversación del curso" or "Preguntas al docente". */
export function channelKind(channel: ChannelSummary, viewer: ChannelViewer): string {
  const canReply = viewer === 'STUDENT' ? channel.studentsCanReply : channel.parentsCanReply;
  if (!canReply) return 'Solo anuncios';
  return channel.replyVisibility === 'PUBLIC' ? 'Conversación del curso' : 'Preguntas al docente';
}

/**
 * BR-ACA-001.17: the course's channels out of the caller's channel list (COM-003): COURSE level for
 * this course only. Open channels come first, by latest post; archived ones last (FR-ACA-001.21).
 */
export function courseChannels(
  list: readonly ChannelSummary[],
  courseId: string,
  viewer: ChannelViewer,
): CourseChannel[] {
  return list
    .filter((c) => c.scope === 'COURSE' && c.courseId === courseId)
    .sort((a, b) => Number(a.archived) - Number(b.archived) || (b.lastPostAt ?? '').localeCompare(a.lastPostAt ?? ''))
    .map((c) => ({ ...c, kind: channelKind(c, viewer) }));
}

/** FR-ACA-001.21: "1 nuevo" / "3 nuevos". */
export function newCount(n: number): string {
  return n === 1 ? '1 nuevo' : `${n} nuevos`;
}

/**
 * FR-ACA-001.23, .24: unread posts per course, from the caller's channel list (BR-ACA-001.17).
 * Only COURSE channels count, and archived ones don't. Courses with nothing unread are left out.
 */
export function unreadByCourse(list: readonly ChannelSummary[]): Map<string, number> {
  const byCourse = new Map<string, number>();
  for (const c of list) {
    if (c.scope !== 'COURSE' || !c.courseId || c.archived || !c.unread) continue;
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
  const open = channels.filter((c) => !c.archived);
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
