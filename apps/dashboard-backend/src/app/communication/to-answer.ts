import { ChannelReplyVisibility } from '@generated/prisma';

/** Who wrote a reply. Only managers and members may reply, so the author's role tells them apart. */
export type ReplyAuthor = 'MEMBER' | 'MANAGER' | 'UNKNOWN';

export interface ToAnswerReply {
  channelId: string;
  postId: string;
  /** PRIVATE channels: the member whose conversation it is; null for public replies. */
  threadUserId: string | null;
  authorId: string | null;
  author: ReplyAuthor;
}

const FAMILY_ROLES = new Set(['PARENT', 'STUDENT']);

/**
 * Members are students and parents; everyone else who could reply manages the channel
 * (BR-COM-003.3, .5). A deleted author is neither: it doesn't ask or answer.
 */
export function replyAuthor(roleName: string | null | undefined, hasAuthor: boolean): ReplyAuthor {
  if (!hasAuthor) return 'UNKNOWN';
  return FAMILY_ROLES.has((roleName ?? '').toUpperCase()) ? 'MEMBER' : 'MANAGER';
}

/**
 * BR-COM-003.12 (decided 2026-11-25): what is waiting for a manager's answer, per channel.
 * - PRIVATE: each member conversation (a post's replies under one member) whose latest reply is the
 *   member's.
 * - PUBLIC: each member reply newer than the latest manager reply in that post's thread.
 * `replies` must be oldest first. Any manager's reply answers it, not only the post's author.
 */
export function countToAnswer(
  channels: readonly { id: string; replyVisibility: ChannelReplyVisibility }[],
  replies: readonly ToAnswerReply[],
): Map<string, number> {
  const visibility = new Map(channels.map((c) => [c.id, c.replyVisibility]));
  const lastInConversation = new Map<string, ToAnswerReply>();
  const waitingInThread = new Map<string, { channelId: string; count: number }>();

  for (const r of replies) {
    const kind = visibility.get(r.channelId);
    if (!kind || r.author === 'UNKNOWN') continue;
    if (kind === 'PRIVATE') {
      // Replies from before the channel turned PRIVATE have no thread: they belong to their author.
      const key = `${r.postId}:${r.threadUserId ?? r.authorId}`;
      lastInConversation.set(key, r);
    } else {
      const thread = waitingInThread.get(r.postId) ?? { channelId: r.channelId, count: 0 };
      thread.count = r.author === 'MANAGER' ? 0 : thread.count + 1;
      waitingInThread.set(r.postId, thread);
    }
  }

  const result = new Map<string, number>();
  const add = (channelId: string, n: number) => n && result.set(channelId, (result.get(channelId) ?? 0) + n);
  for (const r of lastInConversation.values()) if (r.author === 'MEMBER') add(r.channelId, 1);
  for (const t of waitingInThread.values()) add(t.channelId, t.count);
  return result;
}
