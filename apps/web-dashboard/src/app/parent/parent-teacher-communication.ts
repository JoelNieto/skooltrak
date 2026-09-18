import { MessageBubble, PageHeader, ThreadComposer, ThreadList, ThreadScrollPane, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isBefore } from 'date-fns';
import Auth from '../auth/auth';
import { CommunicationApi, Thread, ThreadMessage } from '../communication/communication-api.service';
import { CommunicationSocket } from '../communication/communication-socket.service';
import { OfflineOutbox } from '../communication/offline-outbox.service';

const API = '/api/v1/communication';

@Component({
  selector: 'app-parent-teacher-communication',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, DatePipe, PageHeader, ThreadList, ThreadComposer, ThreadScrollPane, MessageBubble],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Mensajes</li>
      </ul>
    </div>
    <lib-page-header
      title="Comunicación con docentes"
      subtitle="Mensajes del equipo académico. Puedes responder, no iniciar conversaciones."
    />

    <div class="flex gap-4 h-[calc(100vh-12rem)]">
      <aside class="w-80 shrink-0 border border-base-300 rounded-lg flex flex-col bg-base-100">
        <div class="p-2 border-b border-base-300 shrink-0">
          <input
            type="search"
            class="input input-primary input-sm w-full"
            placeholder="Buscar conversación…"
            [(ngModel)]="filterText"
          />
        </div>
        <div class="flex-1 overflow-y-auto">
          @if (threadsResource.isLoading() && threadsResource.value().length === 0) {
            <div class="flex justify-center py-8">
              <span class="loading loading-spinner loading-md"></span>
            </div>
          } @else {
            <lib-thread-list
              [threads]="filteredThreadItems()"
              [selectedId]="selectedId()"
              (selected)="selectedId.set($event)"
            />
          }
        </div>
      </aside>

      <section class="flex-1 border border-base-300 rounded-lg flex flex-col bg-base-100 min-w-0">
        @if (selectedThread(); as thread) {
          <header class="p-3 border-b border-base-300 flex flex-col gap-1">
            <h2 class="font-semibold truncate">{{ thread.title }}</h2>
            <div class="flex items-center gap-1">
              @if (thread.audience) {
                <span class="text-sm opacity-70">{{ thread.audience }}</span>
              }
              @if (thread.urgent) {
                <span class="badge badge-error badge-soft badge-xs">Importante</span>
              }
            </div>
          </header>

          <lib-thread-scroll-pane
            [itemCount]="messages().length"
            [lastIsMine]="lastIsMine()"
            [resetKey]="selectedId()"
          >
            @for (m of messages(); track m.id) {
              <lib-message-bubble
                [body]="m.body"
                [senderName]="senderName(m)"
                [sentAt]="(m.createdAt | date: 'short') ?? ''"
                [urgency]="m.urgency"
                [mine]="m.senderId === meId()"
              />
            } @empty {
              <p class="text-center text-sm opacity-60 mt-10">Aún no hay mensajes.</p>
            }
          </lib-thread-scroll-pane>

          <lib-thread-composer placeholder="Escribe una respuesta…" (send)="send($event)" />
        } @else {
          <div class="flex-1 grid place-items-center px-6 text-center text-sm opacity-60">
            Cuando un docente te escriba, el mensaje aparecerá aquí.
          </div>
        }
      </section>
    </div>
  `,
})
export default class ParentTeacherCommunication {
  #api = inject(CommunicationApi);
  #socket = inject(CommunicationSocket);
  #auth = inject(Auth);
  #toast = inject(Toast);
  #outbox = inject(OfflineOutbox);

  readonly selectedId = signal<string | null>(null);
  readonly filterText = signal('');
  readonly meId = computed(() => this.#auth.meId());
  readonly cursor = signal('');

  #markedRead = new Set<string>();

  public threadsResource = httpResource<Thread[]>(() => `${API}/threads`, { defaultValue: [] });

  public currentMessages = httpResource<ThreadMessage[]>(
    () => {
      if (!this.selectedId()) return undefined;
      const params = new URLSearchParams({ limit: '50' });
      if (this.cursor()) params.set('cursor', this.cursor());
      return `${API}/threads/${this.selectedId()}/messages?${params.toString()}`;
    },
    { defaultValue: [] },
  );

  readonly messages = linkedSignal(() => this.currentMessages.value());

  constructor() {
    afterRenderEffect((onCleanup) => {
      const unsub = this.#socket.onMessageReceived((payload) => {
        this.threadsResource.reload();
        if (payload.threadId !== this.selectedId() || !payload.message) return;
        const msg = payload.message as ThreadMessage;
        this.messages.update((prev) => (prev?.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      });
      onCleanup(unsub);
    });

    afterRenderEffect((onCleanup) => {
      const id = this.selectedId();
      if (!id) return;
      this.#socket.joinThread(id);
      onCleanup(() => this.#socket.leaveThread(id));
    });

    afterRenderEffect((onCleanup) => {
      if (typeof window === 'undefined') return;
      const onOnline = () => void this.flushOutbox();
      window.addEventListener('online', onOnline);
      void this.flushOutbox();
      onCleanup(() => window.removeEventListener('online', onOnline));
    });

    afterRenderEffect(() => {
      if (!this.currentMessages.hasValue()) return;
      this.markReceivedRead(this.currentMessages.value() ?? []);
    });
  }

  readonly threadItems = computed(() => {
    const me = this.meId();
    return [...this.threadsResource.value()]
      .sort((a, b) => {
        const aDate = a.messages?.[0]?.createdAt ?? a.updatedAt;
        const bDate = b.messages?.[0]?.createdAt ?? b.updatedAt;
        return isBefore(aDate, bDate) ? 1 : -1;
      })
      .map((t) => {
        const last = t.messages?.[0];
        const owner = t.participants.find((p) => p.role === 'OWNER' && p.userId !== me)?.user
          ?? t.participants.find((p) => p.role === 'OWNER')?.user;
        const audience = owner
          ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || undefined
          : undefined;
        return {
          id: t.id,
          title: t.title,
          preview: last?.body,
          audience,
          type: t.type,
          urgent: t.urgencyDefault === 'IMPORTANT' || t.urgencyDefault === 'EMERGENCY',
        };
      });
  });

  readonly filteredThreadItems = computed(() => {
    const q = this.filterText().trim().toLowerCase();
    return this.threadItems().filter((t) => {
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || (t.preview ?? '').toLowerCase().includes(q);
    });
  });

  selectedThread = computed(() => this.threadItems().find((t) => t.id === this.selectedId()));

  lastIsMine = computed(() => {
    const messages = this.messages();
    const last = messages[messages.length - 1];
    return !!last && last.senderId === this.meId();
  });

  send(body: string) {
    const id = this.selectedId();
    if (!id || !body.trim()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.#outbox.enqueue(id, body.trim(), 'ROUTINE');
      this.#toast.showSuccess('Se enviará cuando vuelva la conexión');
      return;
    }
    this.#api.sendMessage(id, body.trim(), 'ROUTINE').subscribe({
      next: (msg) => {
        this.messages.update((prev) => (prev?.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        this.threadsResource.reload();
      },
      error: () => this.#toast.showError('No se pudo enviar el mensaje'),
    });
  }

  private async flushOutbox() {
    const sent = await this.#outbox.flush();
    if (sent.length === 0) return;
    this.threadsResource.reload();
    const selected = this.selectedId();
    for (const msg of sent) {
      if (msg.threadId !== selected) continue;
      this.messages.update((prev) => (prev?.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
  }

  senderName(m: ThreadMessage): string {
    return m.sender ? `${m.sender.firstName ?? ''} ${m.sender.lastName ?? ''}`.trim() : '';
  }

  private markReceivedRead(messages: ThreadMessage[]) {
    const me = this.meId();
    for (const m of messages) {
      if (m.senderId === me || this.#markedRead.has(m.id)) continue;
      this.#markedRead.add(m.id);
      this.#api.markRead(m.id).subscribe({ error: () => undefined });
    }
  }
}
