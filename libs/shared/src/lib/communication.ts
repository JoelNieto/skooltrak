/**
 * COM-003 communication contracts, shared by the dashboard API and the web dashboard.
 * There are exactly two ways to communicate: channels (one-to-many) and direct messages
 * (staff ↔ parent). Dates are ISO strings.
 */

export const CHANNEL_SCOPES = ['ORGANIZATION', 'SCHOOL', 'STUDY_PLAN', 'CLASS_GROUP', 'COURSE'] as const;
export type ChannelScopeKey = (typeof CHANNEL_SCOPES)[number];

export const CHANNEL_SCOPE_LABELS: Record<ChannelScopeKey, string> = {
  ORGANIZATION: 'Organización',
  SCHOOL: 'Escuela',
  STUDY_PLAN: 'Plan de estudio',
  CLASS_GROUP: 'Grupo',
  COURSE: 'Curso',
};

export type ChannelReplyVisibilityKey = 'PUBLIC' | 'PRIVATE';

/** How the caller relates to a channel: they manage it, or they are in its audience. */
export type ChannelRole = 'MANAGER' | 'MEMBER';

export interface CommPerson {
  id: string;
  name: string;
}

export interface ChannelSettings {
  name: string;
  description: string;
  audienceStudents: boolean;
  audienceParents: boolean;
  studentsCanReply: boolean;
  parentsCanReply: boolean;
  replyVisibility: ChannelReplyVisibilityKey;
}

export interface ChannelSummary extends ChannelSettings {
  id: string;
  scope: ChannelScopeKey;
  /** "6.° A", "Matemáticas 7", the school's name… */
  targetName: string;
  schoolId: string | null;
  studyPlanId: string | null;
  classGroupId: string | null;
  courseId: string | null;
  archived: boolean;
  role: ChannelRole;
  /** Posts the caller hasn't read (always 0 for managers). */
  unread: number;
  lastPostAt: string | null;
  lastPostPreview: string | null;
}

/** Read stats of a post, only for managers (FR-COM-003.9). */
export interface ChannelPostStats {
  audience: number;
  read: number;
  confirmed: number;
}

export interface ChannelPost {
  id: string;
  body: string;
  author: CommPerson | null;
  createdAt: string;
  requiresConfirmation: boolean;
  /** The caller's own read / confirmation (members). */
  readAt: string | null;
  confirmedAt: string | null;
  /** Replies the caller can see. */
  replyCount: number;
  stats: ChannelPostStats | null;
}

export interface ChannelDetail extends ChannelSummary {
  /** Whether the caller may reply (members) — always true for managers of an open channel. */
  canReply: boolean;
  posts: ChannelPost[];
}

export interface ChannelReply {
  id: string;
  body: string;
  author: CommPerson | null;
  /** True when the author manages the channel. */
  fromManager: boolean;
  createdAt: string;
}

/** One member's conversation under a post in a PRIVATE channel, or the whole list in a PUBLIC one. */
export interface ChannelReplyThread {
  /** The member whose private conversation this is; null for PUBLIC channels. */
  member: CommPerson | null;
  replies: ChannelReply[];
}

export interface ChannelReceipt {
  user: CommPerson;
  kind: 'STUDENT' | 'PARENT';
  /** Parents: the children who put them in the audience. */
  students: string[];
  readAt: string | null;
  confirmedAt: string | null;
}

export interface ChannelTarget {
  id: string;
  name: string;
  /** School name, for plan / group / course targets. */
  context: string | null;
}

export interface RecentChannelPost {
  id: string;
  channelId: string;
  channelName: string;
  body: string;
  author: CommPerson | null;
  createdAt: string;
  unread: boolean;
  requiresConfirmation: boolean;
  confirmed: boolean;
}

export interface DirectConversationSummary {
  id: string;
  /** The other side of the conversation. */
  counterpart: CommPerson;
  student: { id: string; name: string } | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  /** True when the last message came from the counterpart. */
  lastFromCounterpart: boolean;
  unread: number;
}

export interface DirectMessage {
  id: string;
  body: string;
  mine: boolean;
  sender: CommPerson | null;
  createdAt: string;
  /** The other side has read it (only for the caller's own messages). */
  readByCounterpart: boolean;
}

export interface DirectConversationDetail extends DirectConversationSummary {
  /** Staff side or parent side. */
  side: 'STAFF' | 'PARENT';
  messages: DirectMessage[];
}

export interface DirectRecipient {
  student: { id: string; name: string; group: string | null };
  parents: CommPerson[];
}

export interface CommunicationUnread {
  channels: number;
  direct: number;
}

export function personName(u: { name?: string | null; firstName?: string | null; lastName?: string | null } | null): string {
  if (!u) return '—';
  return u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—';
}

export function preview(body: string, length = 120): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
}
