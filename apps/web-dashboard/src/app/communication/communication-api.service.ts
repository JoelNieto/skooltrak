import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ThreadType = 'CLASS_GROUP' | 'COURSE' | 'STUDENT_GUARDIANS' | 'SCHOOL_WIDE' | 'DIRECT';
export type UrgencyTier = 'ROUTINE' | 'IMPORTANT' | 'EMERGENCY';
export type ThreadStatus = 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'APPROVED';

export interface ThreadParticipantUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
}

export interface ThreadParticipant {
  id: string;
  threadId: string;
  userId: string;
  role: string;
  canInitiate: boolean;
  addedById?: string | null;
  joinedAt: string;
  lastReadAt?: string | null;
  user?: ThreadParticipantUser;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  urgency: UrgencyTier;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  sender?: ThreadParticipantUser;
}

export interface Thread {
  id: string;
  organizationId: string;
  type: ThreadType;
  scopeId?: string | null;
  title: string;
  createdById: string;
  ownerRole: string;
  urgencyDefault: UrgencyTier;
  status: ThreadStatus;
  broadcast?: boolean;
  repliesAllowed?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  participants: ThreadParticipant[];
  messages: ThreadMessage[];
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  organizationId?: string | null;
  action: string;
  threadId?: string | null;
  messageId?: string | null;
  detail?: string | null;
  ip?: string | null;
  createdAt: string;
  actor?: ThreadParticipantUser | null;
}

export interface Delivery {
  id: string;
  messageId: string;
  recipientUserId: string;
  channel: string;
  status: string;
  novuEventId?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failureReason?: string | null;
  recipientUser?: ThreadParticipantUser;
}

const API = '/api/v1/communication';

@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  #http = inject(HttpClient);

  listThreads(): Observable<Thread[]> {
    return this.#http.get<Thread[]>(`${API}/threads`);
  }

  getThread(id: string): Observable<Thread> {
    return this.#http.get<Thread>(`${API}/threads/${id}`);
  }

  getMessages(id: string, cursor?: string, limit = 50): Observable<ThreadMessage[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.#http.get<ThreadMessage[]>(`${API}/threads/${id}/messages?${params.toString()}`);
  }

  sendMessage(threadId: string, body: string, urgency?: UrgencyTier): Observable<ThreadMessage> {
    return this.#http.post<ThreadMessage>(`${API}/threads/${threadId}/messages`, {
      body,
      urgency: urgency ?? 'ROUTINE',
    });
  }

  markRead(messageId: string): Observable<{ success: boolean }> {
    return this.#http.patch<{ success: boolean }>(`${API}/messages/${messageId}/read`, {});
  }

  createThread(input: {
    type: ThreadType;
    title: string;
    scopeId?: string | null;
    urgencyDefault?: UrgencyTier;
    participantUserIds?: string[];
    body?: string;
  }): Observable<Thread> {
    return this.#http.post<Thread>(`${API}/threads`, input);
  }

  getDeliveries(messageId: string): Observable<Delivery[]> {
    return this.#http.get<Delivery[]>(`${API}/messages/${messageId}/deliveries`);
  }

  createBroadcast(input: {
    type: ThreadType;
    title: string;
    body: string;
    scopeId?: string | null;
    urgency?: UrgencyTier;
    repliesAllowed?: boolean;
  }): Observable<Thread> {
    return this.#http.post<Thread>(`${API}/broadcasts`, input);
  }

  listBroadcasts(status?: ThreadStatus): Observable<Thread[]> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.#http.get<Thread[]>(`${API}/broadcasts${params}`);
  }

  listRecentBroadcasts(take = 5): Observable<Thread[]> {
    return this.#http.get<Thread[]>(`${API}/inbox/broadcasts?take=${encodeURIComponent(String(take))}`);
  }

  approveBroadcast(id: string): Observable<Thread> {
    return this.#http.post<Thread>(`${API}/broadcasts/${id}/approve`, {});
  }

  updateBroadcast(id: string, input: { repliesAllowed: boolean }): Observable<Thread> {
    return this.#http.patch<Thread>(`${API}/broadcasts/${id}`, input);
  }

  listAudit(): Observable<AuditLog[]> {
    return this.#http.get<AuditLog[]>(`${API}/admin/audit`);
  }

  syncSubscriber(input: { userId: string; channelPrefs?: Record<string, boolean> }): Observable<unknown> {
    return this.#http.post(`${API}/subscribers/sync`, input);
  }
}
