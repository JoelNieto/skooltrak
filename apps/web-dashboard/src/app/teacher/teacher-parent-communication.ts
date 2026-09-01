import { MessageBubble, Modal, PageHeader, ThreadComposer, ThreadList, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import {
  CommunicationApi,
  Delivery,
  Thread,
  ThreadMessage,
  UrgencyTier,
} from '../communication/communication-api.service';
import { CommunicationSocket } from '../communication/communication-socket.service';
import { NewThreadFormComponent } from '../communication/new-thread-form.component';

interface ThreadListItem {
  id: string;
  title: string;
  preview?: string;
  type?: string;
  urgent?: boolean;
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
              class="btn btn-xs"
              [class.btn-primary]="urgencyFilter() === 'ROUTINE'"
              (click)="urgencyFilter.set('ROUTINE')"
            >
              Rutina
            </button>
            <button
              class="btn btn-xs"
              [class.btn-warning]="urgencyFilter() === 'IMPORTANT'"
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
          <header class="p-3 border-b border-base-300 flex items-center gap-2">
            <h2 class="font-semibold truncate">{{ thread.title }}</h2>
            <span class="badge badge-soft badge-sm">{{ typeLabel(thread.type) }}</span>
            @if (thread.urgencyDefault === 'IMPORTANT') {
              <span class="badge badge-warning badge-sm">Importante</span>
            }
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

          <div class="shrink-0 border-t border-base-300 p-2 bg-base-100">
            <div class="flex items-center gap-2 mb-2">
              <label for="urgency" class="text-xs opacity-70">Prioridad</label>
              <select class="select select-primary" [(ngModel)]="composerUrgency">
                <option value="ROUTINE">Rutina</option>
                <option value="IMPORTANT">Importante</option>
              </select>
            </div>
            <lib-thread-composer (send)="send($event)" />
          </div>
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

  selectedThread(): Thread | undefined {
    return this.threads().find((t) => t.id === this.selectedId());
  }

  threadItems(): ThreadListItem[] {
    return this.threads().map((t) => {
      const last = t.messages?.[0];
      return {
        id: t.id,
        title: t.title,
        preview: last?.body,
        type: t.type,
        urgent: t.urgencyDefault === 'IMPORTANT',
      };
    });
  }

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
      next: (threads) => this.threads.set(threads ?? []),
      error: () => this.#toast.showError('No se pudieron cargar los hilos'),
    });
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

  recipientCount(thread: Thread): number {
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
