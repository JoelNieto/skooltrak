import type {
  ChannelDetail,
  ChannelPost,
  ChannelReceipt,
  ChannelReplyThread,
  ChannelScopeKey,
  ChannelSettings,
  ChannelSummary,
  ChannelTarget,
  CommunicationUnread,
  DirectConversationDetail,
  DirectRecipient,
} from '@/shared';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subject, switchMap, merge, timer } from 'rxjs';

const API = '/api/v1/communication';
const UNREAD_POLL_MS = 60_000;

export interface CreateChannel extends Partial<ChannelSettings> {
  scope: ChannelScopeKey;
  targetId?: string;
  name: string;
  audienceStudents: boolean;
  audienceParents: boolean;
}

/**
 * COM-003 data access: channels (one-to-many) and direct messages (staff ↔ parent). Lists and
 * detail views read through `httpResource` in the pages; writes go through here.
 */
@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  #http = inject(HttpClient);
  #refreshUnread = new Subject<void>();

  /** FR .15: sidebar badges. Polls, and refreshes right after the caller reads something. */
  readonly unread = rxResource({
    stream: () =>
      merge(timer(0, UNREAD_POLL_MS), this.#refreshUnread).pipe(
        switchMap(() => this.#http.get<CommunicationUnread>(`${API}/unread`)),
      ),
    defaultValue: { channels: 0, direct: 0 },
  });

  refreshUnread() {
    this.#refreshUnread.next();
  }

  // ── Channels ────────────────────────────────────────────────────────────

  targets(scope: ChannelScopeKey, schoolId?: string) {
    const params: Record<string, string> = { scope };
    if (schoolId) params['schoolId'] = schoolId;
    return firstValueFrom(this.#http.get<ChannelTarget[]>(`${API}/channels/targets`, { params }));
  }

  createChannel(input: CreateChannel) {
    return firstValueFrom(this.#http.post<ChannelSummary>(`${API}/channels`, input));
  }

  updateChannel(id: string, input: Partial<ChannelSettings> & { archived?: boolean }) {
    return firstValueFrom(this.#http.patch<ChannelSummary>(`${API}/channels/${id}`, input));
  }

  channel(id: string) {
    return firstValueFrom(this.#http.get<ChannelDetail>(`${API}/channels/${id}`));
  }

  async markChannelRead(id: string) {
    const result = await firstValueFrom(this.#http.post<{ marked: number }>(`${API}/channels/${id}/read`, {}));
    if (result.marked) this.refreshUnread();
    return result;
  }

  createPost(channelId: string, body: string, requiresConfirmation: boolean) {
    return firstValueFrom(
      this.#http.post<ChannelPost>(`${API}/channels/${channelId}/posts`, { body, requiresConfirmation }),
    );
  }

  deletePost(channelId: string, postId: string) {
    return firstValueFrom(this.#http.delete<{ id: string }>(`${API}/channels/${channelId}/posts/${postId}`));
  }

  confirm(channelId: string, postId: string) {
    return firstValueFrom(
      this.#http.post<{ confirmedAt: string }>(`${API}/channels/${channelId}/posts/${postId}/confirm`, {}),
    );
  }

  receipts(channelId: string, postId: string) {
    return firstValueFrom(this.#http.get<ChannelReceipt[]>(`${API}/channels/${channelId}/posts/${postId}/receipts`));
  }

  replies(channelId: string, postId: string) {
    return firstValueFrom(this.#http.get<ChannelReplyThread[]>(`${API}/channels/${channelId}/posts/${postId}/replies`));
  }

  reply(channelId: string, postId: string, body: string, threadUserId?: string) {
    return firstValueFrom(
      this.#http.post<ChannelReplyThread>(`${API}/channels/${channelId}/posts/${postId}/replies`, {
        body,
        ...(threadUserId ? { threadUserId } : {}),
      }),
    );
  }

  /** The open channel the caller manages for this course or group, if any. */
  async managedChannelFor(scope: 'COURSE' | 'CLASS_GROUP', targetId: string): Promise<string | null> {
    const channels = await firstValueFrom(this.#http.get<ChannelSummary[]>(`${API}/channels`));
    const key = scope === 'COURSE' ? 'courseId' : 'classGroupId';
    return channels.find((c) => c.role === 'MANAGER' && !c.archived && c.scope === scope && c[key] === targetId)?.id ?? null;
  }

  // ── Direct ──────────────────────────────────────────────────────────────

  recipients(q: string) {
    return firstValueFrom(this.#http.get<DirectRecipient[]>(`${API}/direct/recipients`, { params: { q } }));
  }

  startDirect(parentUserId: string, studentId?: string) {
    return firstValueFrom(
      this.#http.post<DirectConversationDetail>(`${API}/direct`, { parentUserId, ...(studentId ? { studentId } : {}) }),
    );
  }

  sendDirect(conversationId: string, body: string) {
    return firstValueFrom(
      this.#http.post<{ id: string; createdAt: string }>(`${API}/direct/${conversationId}/messages`, { body }),
    );
  }
}
