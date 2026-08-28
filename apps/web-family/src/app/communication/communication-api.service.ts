import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type ThreadType = 'CLASS_GROUP' | 'COURSE' | 'STUDENT_GUARDIANS' | 'SCHOOL_WIDE' | 'DIRECT';
export type UrgencyTier = 'ROUTINE' | 'IMPORTANT' | 'EMERGENCY';
export type ThreadStatus = 'ACTIVE' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'APPROVED';

export interface ThreadParticipant {
  userId: string;
  role: string;
  canInitiate: boolean;
  user?: { id: string; firstName?: string; lastName?: string };
}

export interface Thread {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  scopeId?: string | null;
  urgencyDefault: UrgencyTier;
  broadcast?: boolean;
  participants: ThreadParticipant[];
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  urgency: UrgencyTier;
  createdAt: string;
  sender?: { id: string; firstName?: string; lastName?: string };
}

export interface Delivery {
  id: string;
  messageId: string;
  recipientUserId: string;
  channel: string;
  status: string;
  readAt?: string | null;
}

const API = '/api/v1/communication';

@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  readonly baseUrl = API;

  #http = inject(HttpClient);

  listThreads(): Observable<Thread[]> {
    return this.#http.get<Thread[]>(`${API}/threads`);
  }

  getThread(id: string): Observable<Thread> {
    return this.#http.get<Thread>(`${API}/threads/${id}`);
  }

  getMessages(id: string, cursor?: string, limit = 50): Observable<Message[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.#http.get<Message[]>(`${API}/threads/${id}/messages?${params.toString()}`);
  }

  sendMessage(threadId: string, body: string, urgency?: UrgencyTier): Observable<Message> {
    return this.#http.post<Message>(`${API}/threads/${threadId}/messages`, {
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
  }): Observable<Thread> {
    return this.#http.post<Thread>(`${API}/threads`, input);
  }

  createBroadcast(input: {
    type: ThreadType;
    title: string;
    body: string;
    scopeId?: string | null;
    urgency?: UrgencyTier;
  }): Observable<Thread> {
    return this.#http.post<Thread>(`${API}/broadcasts`, input);
  }

  getDeliveries(messageId: string): Observable<Delivery[]> {
    return this.#http.get<Delivery[]>(`${API}/messages/${messageId}/deliveries`);
  }
}

/** Tiny shared signal store for the active thread selection. */
@Injectable({ providedIn: 'root' })
export class CommunicationState {
  readonly selectedThreadId = signal<string | null>(null);
}
