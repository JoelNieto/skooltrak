import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { CommunicationApi, Message } from './communication-api.service';

export interface OutboxItem {
  id: string;
  threadId: string;
  body: string;
  urgency?: string;
  createdAt: number;
}

/**
 * Offline outgoing queue. Messages composed while offline are persisted to
 * IndexedDB/localStorage and flushed when connectivity returns. Phase 0 seam:
 * uses localStorage for simplicity; swap for IndexedDB + SW sync later.
 */
@Injectable({ providedIn: 'root' })
export class OfflineOutbox {
  readonly #api = inject(CommunicationApi);
  readonly #storageKey = 'skooltrak.communication.outbox';
  readonly #items = new BehaviorSubject<OutboxItem[]>(this.#load());
  readonly items$: Observable<OutboxItem[]> = this.#items.asObservable();

  get pending(): OutboxItem[] {
    return this.#items.value;
  }

  enqueue(threadId: string, body: string, urgency?: string): OutboxItem {
    const item: OutboxItem = {
      id: crypto.randomUUID(),
      threadId,
      body,
      urgency,
      createdAt: Date.now(),
    };
    const next = [...this.#items.value, item];
    this.#persist(next);
    return item;
  }

  async flush(): Promise<Message[]> {
    const queued = this.#items.value;
    const sent: Message[] = [];
    for (const item of queued) {
      try {
        const message = await firstValueFrom(
          this.#api.sendMessage(item.threadId, item.body, (item.urgency as never) ?? undefined),
        );
        sent.push(message);
      } catch {
        break;
      }
    }
    if (sent.length > 0) {
      this.#persist(this.#items.value.slice(sent.length));
    }
    return sent;
  }

  #load(): OutboxItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(this.#storageKey) ?? '[]') as OutboxItem[];
    } catch {
      return [];
    }
  }

  #persist(items: OutboxItem[]) {
    this.#items.next(items);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.#storageKey, JSON.stringify(items));
    }
  }
}
