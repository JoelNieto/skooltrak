import { MessageBubble, PageHeader, ThreadComposer, ThreadList, ThreadListItem } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, afterRenderEffect, computed, inject, linkedSignal, signal } from '@angular/core';
import Auth from '../auth/auth';
import { CommunicationApi, Thread, ThreadMessage } from './communication-api.service';
import { CommunicationSocket } from './communication-socket.service';
import { OfflineOutbox } from './offline-outbox.service';
const API = '/api/v1/communication';
@Component({
  selector: 'app-family-chat',
  imports: [ThreadList, ThreadComposer, MessageBubble, PageHeader],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Chat escolar</li>
      </ul>
    </div>
    <lib-page-header title="Chat escolar" subtitle="Conversaciones con profesores y personal escolar" />
    <div class="flex gap-4 h-[calc(100vh-12rem)]">
      <aside class="w-80 shrink-0 border border-base-300 rounded-lg flex flex-col bg-base-100">
        <div class="p-2 border-b border-base-300 space-y-2 shrink-0">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h1 class="text-lg font-semibold">Chat escolar</h1>
              @if (outbox.pending.length) {
                <p class="text-xs text-warning mt-1">{{ outbox.pending.length }} message(s) queued offline</p>
              }
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <lib-thread-list [threads]="threadItems()" [selectedId]="selectedId()" (selected)="selectedId.set($event)" />
        </div>
      </aside>

      <section class="flex-1 border border-base-300 rounded-lg flex flex-col bg-base-100 min-w-0">
        @if (selectedThread(); as thread) {
          <header class="p-3 border-b border-base-300 flex items-center gap-2">
            <h2 class="font-semibold truncate">{{ thread.title }}</h2>
            <span class="badge badge-soft badge-sm">{{ thread.type }}</span>
            @if (thread.urgencyDefault === 'EMERGENCY') {
              <span class="badge badge-warning badge-sm">Urgente</span>
            }
          </header>

          <div #messagesContainer class="flex-1 overflow-y-auto p-3 space-y-2">
            @for (m of messages(); track m.id) {
              <div class="space-y-0.5">
                <lib-message-bubble
                  [body]="m.body"
                  [senderName]="senderName(m)"
                  [sentAt]="sentAt(m)"
                  [urgency]="m.urgency"
                  [mine]="m.senderId === auth.meId()"
                />
              </div>
            } @empty {
              <p class="text-center text-sm opacity-60 mt-10">No messages yet.</p>
            }
          </div>

          <div class="shrink-0 border-t border-base-300 p-2 bg-base-100">
            <lib-thread-composer (send)="send($event)" />
          </div>
        } @else {
          <div class="flex-1 grid place-items-center text-sm opacity-60">
            Selecciona una conversación para comenzar.
          </div>
        }
      </section>
    </div>
  `,
})
export default class FamilyChatComponent {
  readonly #api = inject(CommunicationApi);
  readonly #socket = inject(CommunicationSocket);
  readonly outbox = inject(OfflineOutbox);
  readonly auth = inject(Auth);
  readonly #http = inject(HttpClient);
  readonly cursor = signal('');

  readonly selectedId = signal<string | null>(null);
  readonly messagesResource = httpResource<ThreadMessage[]>(
    () => {
      if (!this.selectedId()) return;
      const limit = 50;
      const params = new URLSearchParams({ limit: String(limit) });
      if (this.cursor()) params.set('cursor', this.cursor());
      return `${API}/threads/${this.selectedId()}/messages?${params.toString()}`;
    },
    { defaultValue: [] },
  );

  readonly messages = linkedSignal(() => this.messagesResource.value());

  readonly threadsResource = httpResource<Thread[]>(() => `${API}/threads`, { defaultValue: [] });
  readonly threads = linkedSignal<Thread[]>(() => this.threadsResource.value());
  private studentNames = signal<Map<string, string>>(new Map());
  private classGroupNames = signal<Map<string, string>>(new Map());
  readonly threadItems = computed<ThreadListItem[]>(() =>
    this.threads().map((t) => {
      const last = t.messages?.[0];

      // Determine audience based on thread type
      let audience: string | undefined;
      if (t.scopeId) {
        if (t.type === 'STUDENT_GUARDIANS') {
          audience = `Estudiante: (${this.studentNames().get(t.scopeId) ?? `Estudiante (ID: ${t.scopeId})`})`;
        } else if (t.type === 'CLASS_GROUP') {
          audience = `Grupo: (${this.classGroupNames().get(t.scopeId) ?? `Grupo (ID: ${t.scopeId})`})`;
        } else if (t.type === 'COURSE') {
          audience = t.scopeId ? `Curso (ID: ${t.scopeId})` : 'Curso';
        } else if (t.type === 'SCHOOL_WIDE') {
          audience = 'Todo el Colegio';
        } else if (t.type === 'DIRECT') {
          audience = 'Mensaje Directo';
        } else {
          audience = t.type;
        }
      } else {
        switch (t.type) {
          case 'STUDENT_GUARDIANS':
            audience = 'Estudiante';
            break;
          case 'CLASS_GROUP':
            audience = 'Grupo de Clase';
            break;
          case 'COURSE':
            audience = 'Curso';
            break;
          case 'SCHOOL_WIDE':
            audience = 'Todo el Colegio';
            break;
          case 'DIRECT':
            audience = 'Mensaje Directo';
            break;
          default:
            audience = t.type;
            break;
        }
      }

      return {
        id: t.id,
        title: t.title,
        preview: last?.body,
        audience: audience,
        type: t.type,
        urgent: t.urgencyDefault === 'EMERGENCY',
      };
    }),
  );

  constructor() {
    afterRenderEffect((onCleanup) => {
      const id = this.selectedId();
      if (!id) return;
      this.#socket.joinThread(id);
      const unsub = this.#socket.onMessageReceived((payload) => {
        if (payload.threadId !== id || !payload.message) return;
        const msg = payload.message as ThreadMessage;
        this.messages.update((prev) => (prev?.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      });
      onCleanup(() => {
        unsub();
        this.#socket.disconnect();
      });
    });

    afterRenderEffect(() => {
      if (!this.threadsResource.hasValue()) return;
      this.fetchAudienceNames(this.threadsResource.value() ?? []);
    });
  }

  selectedThread = computed(() => this.threads().find((t) => t.id === this.selectedId()));

  private fetchAudienceNames(threads: Thread[]): void {
    const studentIds = new Set<string>();
    const classGroupIds = new Set<string>();

    for (const thread of threads) {
      if (thread.type === 'STUDENT_GUARDIANS' && thread.scopeId) {
        studentIds.add(thread.scopeId);
      } else if (thread.type === 'CLASS_GROUP' && thread.scopeId) {
        classGroupIds.add(thread.scopeId);
      }
    }

    if (studentIds.size > 0) {
      const ids = Array.from(studentIds).join(',');
      this.#http
        .get<{ id: string; firstName: string; lastName: string }[]>(`/api/v1/students`, {
          params: { ids },
        })
        .subscribe({
          next: (students) => {
            const map = new Map<string, string>();
            for (const s of students) {
              const fullName = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
              if (fullName) {
                map.set(s.id, fullName);
              }
            }
            this.studentNames.set(map);
          },
          error: (err) => {
            console.warn('Failed to fetch student names', err);
          },
        });
    }

    if (classGroupIds.size > 0) {
      const ids = Array.from(classGroupIds).join(',');
      this.#http
        .get<{ id: string; name: string }[]>(`/api/v1/class-groups`, {
          params: { ids },
        })
        .subscribe({
          next: (classGroups) => {
            const map = new Map<string, string>();
            for (const cg of classGroups) {
              map.set(cg.id, cg.name);
            }
            this.classGroupNames.set(map);
          },
          error: (err) => {
            console.warn('Failed to fetch class group names', err);
          },
        });
    }
  }

  send(body: string) {
    const threadId = this.selectedId();
    if (!threadId) return;
    const temp: ThreadMessage = {
      id: crypto.randomUUID(),
      threadId,
      senderId: this.auth.meId() ?? 'me',
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

  senderName(m: ThreadMessage): string {
    return m.sender ? `${m.sender.firstName ?? ''} ${m.sender.lastName ?? ''}`.trim() : '';
  }

  sentAt(m: ThreadMessage): string {
    return new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
