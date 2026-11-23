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
