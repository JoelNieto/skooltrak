import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ThreadComposer, ThreadList, MessageBubble, ThreadListItem } from '#/ui';
import { CommunicationApi, Message, Thread } from './communication-api.service';
import { CommunicationSocket } from './communication-socket.service';
import { OfflineOutbox } from './offline-outbox.service';
import { AuthService } from '../auth.service';
import { readAccessTokenFromStorage } from '#/client-auth';

function currentUserId(): string | null {
  const token = readAccessTokenFromStorage();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-family-home',
  imports: [CommonModule, ThreadList, ThreadComposer, MessageBubble],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-[100dvh] bg-base-100">
      <aside class="w-80 border-r border-base-300 flex flex-col">
        <header class="p-3 border-b border-base-300 flex items-center justify-between gap-2">
          <div>
            <h1 class="text-lg font-semibold">Family Messages</h1>
            @if (outbox.pending.length) {
              <p class="text-xs text-warning mt-1">
                {{ outbox.pending.length }} message(s) queued offline
              </p>
            }
          </div>
          <button class="btn btn-sm btn-ghost" (click)="logout()">Sign out</button>
        </header>
        <div class="flex-1 overflow-y-auto">
          <lib-thread-list
            [threads]="threadItems()"
            [selectedId]="selectedId()"
            (selected)="selectThread($event)"
          />
        </div>
      </aside>

      <section class="flex-1 flex flex-col">
        @if (selectedThread(); as thread) {
          <header class="p-3 border-b border-base-300">
            <h2 class="font-medium">{{ thread.title }}</h2>
            <p class="text-xs opacity-60">{{ thread.type }} · {{ thread.status }}</p>
          </header>
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            @for (m of messages(); track m.id) {
              <lib-message-bubble
                [body]="m.body"
                [senderName]="senderName(m)"
                [sentAt]="sentAt(m)"
                [urgency]="m.urgency"
                [mine]="m.senderId === meId()"
              />
            } @empty {
              <p class="text-center text-sm opacity-60 mt-10">No messages yet.</p>
            }
          </div>
          <lib-thread-composer (send)="send($event)" />
        } @else {
          <div class="flex-1 grid place-items-center text-sm opacity-60">
            Select a conversation to start.
          </div>
        }
      </section>
    </div>
  `,
})
export class FamilyHomeComponent implements OnInit, OnDestroy {
  readonly #api = inject(CommunicationApi);
  readonly #socket = inject(CommunicationSocket);
  readonly outbox = inject(OfflineOutbox);
  readonly #auth = inject(AuthService);

  readonly threads = signal<Thread[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly meId = signal<string | null>(currentUserId());

  #unsub: (() => void) | null = null;

  ngOnInit(): void {
    this.#api.listThreads().subscribe((threads) => this.threads.set(threads));
    this.#unsub = this.#socket.onMessageReceived((payload) => {
      if (payload.threadId === this.selectedId()) {
        this.messages.update((m) => [...m, payload.message as Message]);
      }
      this.#api.listThreads().subscribe((threads) => this.threads.set(threads));
    });
  }

  ngOnDestroy(): void {
    this.#unsub?.();
    this.#socket.disconnect();
  }

  selectedThread(): Thread | undefined {
    return this.threads().find((t) => t.id === this.selectedId());
  }

  threadItems = (): ThreadListItem[] =>
    this.threads().map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      urgent: t.urgencyDefault === 'EMERGENCY',
    }));

  selectThread(id: string) {
    this.selectedId.set(id);
    this.#socket.joinThread(id);
    this.#api.getMessages(id).subscribe((messages) => this.messages.set(messages));
  }

  send(body: string) {
    const threadId = this.selectedId();
    if (!threadId) return;
    const temp: Message = {
      id: crypto.randomUUID(),
      threadId,
      senderId: this.meId() ?? 'me',
      body,
      urgency: 'ROUTINE',
      createdAt: new Date().toISOString(),
    };
    this.messages.update((m) => [...m, temp]);

    if (navigator.onLine) {
      this.#api.sendMessage(threadId, body).subscribe();
    } else {
      this.outbox.enqueue(threadId, body);
    }
  }

  logout() {
    this.#socket.disconnect();
    this.#auth.logout();
    location.reload();
  }

  senderName(m: Message): string {
    return m.sender ? `${m.sender.firstName ?? ''} ${m.sender.lastName ?? ''}`.trim() : '';
  }

  sentAt(m: Message): string {
    return new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
