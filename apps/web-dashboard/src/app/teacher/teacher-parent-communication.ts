import { MessageBubble, Modal, PageHeader, ThreadComposer, ThreadList, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isBefore } from 'date-fns';
import Auth from '../auth/auth';
import {
  CommunicationApi,
  Delivery,
  Thread,
  ThreadMessage,
  ThreadParticipant,
  UrgencyTier,
} from '../communication/communication-api.service';
import { CommunicationSocket } from '../communication/communication-socket.service';
import { NewThreadFormComponent } from '../communication/new-thread-form.component';

interface ThreadListItem {
  id: string;
  title: string;
  preview?: string;
  audience?: string;
  type: string;
  urgent?: boolean;
  participants: ThreadParticipant[];
}

@Component({
  selector: 'app-teacher-parent-communication',
  imports: [RouterLink, FormsModule, DatePipe, PageHeader, ThreadList, ThreadComposer, MessageBubble],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Comunicaciones</li>
      </ul>
    </div>
    <lib-page-header
      title="Comunicación con familias"
      subtitle="Crea hilos con grupos de clase o padres de un estudiante."
      actionLabel="Nuevo mensaje"
      actionIcon="mail"
      (action)="openNewThread()"
    />

    <div class="flex gap-4 h-[calc(100vh-12rem)]">
      <aside class="w-80 shrink-0 border border-base-300 rounded-lg flex flex-col bg-base-100">
        <div class="p-2 border-b border-base-300 space-y-2 shrink-0">
          <input
            type="search"
            class="input input-primary input-sm w-full"
            placeholder="Buscar conversación…"
            [(ngModel)]="filterText"
          />
          <div class="flex flex-wrap gap-1">
            <button
              class="btn btn-xs"
              [class.btn-primary]="urgencyFilter() === 'ALL'"
              (click)="urgencyFilter.set('ALL')"
            >
              Todas
            </button>
            <button
              class="btn btn-xs btn-soft"
              [class.btn-warning]="urgencyFilter() === 'ROUTINE'"
              (click)="urgencyFilter.set('ROUTINE')"
            >
              Rutina
            </button>
            <button
              class="btn btn-xs btn-soft"
              [class.btn-error]="urgencyFilter() === 'IMPORTANT'"
              (click)="urgencyFilter.set('IMPORTANT')"
            >
              Importante
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <lib-thread-list
            [threads]="filteredThreadItems()"
            [selectedId]="selectedId()"
            (selected)="selectThread($event)"
          />
        </div>
      </aside>

      <section class="flex-1 border border-base-300 rounded-lg flex flex-col bg-base-100 min-w-0">
        @if (selectedThread(); as thread) {
          <header class="p-3 border-b border-base-300 flex flex-col gap-1">
            <h2 class="font-semibold truncate">
              {{ thread.title }}
            </h2>
            <div class="flex items-center gap-1">
              <span class="text-sm opacity-70">{{ thread.audience }}</span>
              @if (thread.urgent) {
                <span class="badge badge-error badge-soft badge-xs">Importante</span>
              }
            </div>
          </header>

          <div #messagesContainer class="flex-1 overflow-y-auto p-3 space-y-2">
            @for (m of messages(); track m.id) {
              <div class="space-y-0.5">
                <lib-message-bubble
                  [body]="m.body"
                  [senderName]="senderName(m)"
                  [sentAt]="(m.createdAt | date: 'short') ?? ''"
                  [urgency]="m.urgency"
                  [mine]="m.senderId === meId()"
                />
                @if (m.senderId === meId() && deliveriesByMessage()[m.id]; as deliveries) {
                  <p class="text-[11px] opacity-60 text-right pr-1">
                    Leído por {{ readCount(deliveries) }} de {{ recipientCount(thread) }}
                  </p>
                }
              </div>
            } @empty {
              <p class="text-center text-sm opacity-60 mt-10">Aún no hay mensajes.</p>
            }
          </div>

          <lib-thread-composer (send)="send($event)" />
        } @else {
          <div class="flex-1 grid place-items-center text-sm opacity-60">
            Selecciona una conversación para ver los mensajes.
          </div>
        }
      </section>
    </div>
  `,
})
export default class TeacherParentCommunication {
  #api = inject(CommunicationApi);
  #socket = inject(CommunicationSocket);
  #auth = inject(Auth);
  #modal = inject(Modal);
  #toast = inject(Toast);
  #http = inject(HttpClient);

  readonly threads = signal<Thread[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly messages = signal<ThreadMessage[]>([]);
  readonly deliveriesByMessage = signal<Record<string, Delivery[]>>({});
  readonly composerUrgency = signal<UrgencyTier>('ROUTINE');
  readonly filterText = signal('');
  readonly urgencyFilter = signal<'ALL' | UrgencyTier>('ALL');

  readonly meId = signal<string | null>(this.#auth.user()?.id ?? null);

  private studentNames = signal<Map<string, string>>(new Map());
  private classGroupNames = signal<Map<string, string>>(new Map());

  #markedRead = new Set<string>();

  constructor() {
    this.loadThreads();

    effect((onCleanup) => {
      const id = this.selectedId();
      if (!id) return;
      const unsub = this.#socket.onMessageReceived((payload) => {
        if (payload.threadId !== id || !payload.message) return;
        const msg = payload.message as ThreadMessage;
        this.messages.update((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      });
      const unsubDelivery = this.#socket.onDeliveryUpdate(() => this.refreshDeliveries());
      onCleanup(() => {
        unsub();
        unsubDelivery();
        this.#socket.leaveThread(id);
      });
    });
  }

  get me(): string | null {
    return this.meId();
  }

  selectedThread(): ThreadListItem | undefined {
    return this.threadItems().find((t) => t.id === this.selectedId());
  }

  threadItems = linkedSignal(() => {
    return this.threads()
      .sort((a, b) => (isBefore(a.messages[0].createdAt, b.messages[0].createdAt) ? 1 : -1))
      .map((t) => {
        const last = t.messages?.[0];

        // Determine audience based on thread type
        let audience: string | undefined;
        if (t.scopeId) {
          if (t.type === 'STUDENT_GUARDIANS') {
            audience = `Estudiante: (${this.studentNames().get(t.scopeId) ?? `Estudiante (ID: ${t.scopeId})`})`;
          } else if (t.type === 'CLASS_GROUP') {
            audience = `Grupo: (${this.classGroupNames().get(t.scopeId) ?? `Grupo (ID: ${t.scopeId})`})`;
          } else if (t.type === 'COURSE') {
            // For course, we don't have a service to fetch course name, so we'll use scopeId or a placeholder
            audience = t.scopeId ? `Curso (ID: ${t.scopeId})` : 'Curso';
          } else if (t.type === 'SCHOOL_WIDE') {
            audience = 'Todo el Colegio';
          } else if (t.type === 'DIRECT') {
            audience = 'Mensaje Directo';
          } else {
            audience = t.type;
          }
        } else {
          // No scopeId, fallback to type-based audience
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
          urgent: t.urgencyDefault === 'IMPORTANT',
          participants: t.participants,
        };
      });
  });

  filteredThreadItems(): ThreadListItem[] {
    const q = this.filterText().trim().toLowerCase();
    const urg = this.urgencyFilter();
    return this.threadItems().filter((t) => {
      const matchesUrgency = urg === 'ALL' || (urg === 'ROUTINE' && !t.urgent) || (urg === 'IMPORTANT' && t.urgent);
      const matchesText = !q || t.title.toLowerCase().includes(q) || (t.preview ?? '').toLowerCase().includes(q);
      return matchesUrgency && matchesText;
    });
  }

  loadThreads() {
    this.#api.listThreads().subscribe({
      next: (threads) => {
        this.threads.set(threads ?? []);
        this.fetchAudienceNames(threads ?? []);
      },
      error: () => this.#toast.showError('No se pudieron cargar los hilos'),
    });
  }

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
        .get<{ id: string; firstName: string; fatherName: string }[]>(`/api/v1/students`, {
          params: { ids },
        })
        .subscribe({
          next: (students) => {
            const map = new Map<string, string>();
            for (const s of students) {
              const fullName = `${s.firstName ?? ''} ${s.fatherName ?? ''}`.trim();
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

  openNewThread() {
    const ref = this.#modal.open(NewThreadFormComponent, {
      title: 'Nuevo mensaje',
      size: 'medium',
    });
    ref.closed.subscribe((result) => {
      const thread = result as Thread | undefined;
      if (thread) {
        this.loadThreads();
        this.selectThread(thread.id);
      }
    });
  }

  selectThread(id: string) {
    this.selectedId.set(id);
    this.messages.set([]);
    this.#socket.joinThread(id);
    this.#api.getMessages(id).subscribe({
      next: (messages) => {
        this.messages.set(messages ?? []);
        this.markReceivedRead(messages ?? []);
        this.refreshDeliveries();
      },
      error: () => this.#toast.showError('No se pudieron cargar los mensajes'),
    });
  }

  private markReceivedRead(messages: ThreadMessage[]) {
    const me = this.meId();
    for (const m of messages) {
      if (m.senderId === me || this.#markedRead.has(m.id)) continue;
      this.#markedRead.add(m.id);
      this.#http.patch(`/api/v1/communication/messages/${m.id}/read`, {}).subscribe({ error: () => undefined });
    }
  }

  send(body: string) {
    const id = this.selectedId();
    if (!id || !body.trim()) return;
    this.#api.sendMessage(id, body.trim(), this.composerUrgency()).subscribe({
      next: (msg) => {
        this.messages.update((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        this.refreshDeliveries();
      },
      error: () => this.#toast.showError('No se pudo enviar el mensaje'),
    });
  }

  private refreshDeliveries() {
    const thread = this.selectedThread();
    if (!thread) return;
    const me = this.meId();
    for (const m of this.messages()) {
      if (m.senderId !== me) continue;
      this.#api.getDeliveries(m.id).subscribe({
        next: (deliveries) => this.deliveriesByMessage.update((map) => ({ ...map, [m.id]: deliveries ?? [] })),
        error: () => undefined,
      });
    }
  }

  recipientCount(thread: ThreadListItem): number {
    const me = this.meId();
    return thread.participants.filter((p) => p.userId !== me).length;
  }

  readCount(deliveries: Delivery[]): number {
    const read = new Set(
      deliveries.filter((d) => d.channel === 'IN_APP' && d.status === 'READ').map((d) => d.recipientUserId),
    );
    return read.size;
  }

  senderName(m: ThreadMessage): string {
    return m.sender ? `${m.sender.firstName ?? ''} ${m.sender.lastName ?? ''}`.trim() : '';
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      CLASS_GROUP: 'Grupo de clase',
      STUDENT_GUARDIANS: 'Padres de estudiante',
      COURSE: 'Curso',
      SCHOOL_WIDE: 'Institución',
      DIRECT: 'Directo',
    };
    return labels[type] ?? type;
  }
}
