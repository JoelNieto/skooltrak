import {
  Badge,
  Button,
  EmptyState,
  Icon,
  MessageBubble,
  PageHeader,
  Spinner,
  ThreadComposer,
  ThreadScrollPane,
  Toast,
  UiInput,
} from '#/ui';
import { DirectConversationDetail, DirectConversationSummary, DirectRecipient } from '@/shared';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { errorMessage } from './channel-form';
import { CommunicationApi } from './communication-api';

const API = '/api/v1/communication';
const REFRESH_MS = 15_000;

/**
 * COM-003 direct messages (FR .12–.14): staff ↔ parent, one to one. Staff start conversations;
 * parents reply. Students never reach this page (route needs COMMUNICATION_DIRECT, API refuses them).
 */
@Component({
  selector: 'app-direct',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    RouterLink,
    Badge,
    Button,
    Icon,
    Spinner,
    EmptyState,
    MessageBubble,
    ThreadComposer,
    ThreadScrollPane,
    UiInput,
    FormsModule,
    DatePipe,
  ],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Mensajes directos' }]"
      title="Mensajes directos"
      [subtitle]="isStaff() ? 'Conversaciones uno a uno con acudientes.' : 'Conversaciones con el personal y los docentes de la escuela.'"
      [actionLabel]="isStaff() ? 'Nuevo mensaje' : undefined"
      actionIcon="plus"
      (action)="picking.set(true)"
    />

    <div class="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-12rem)]">
      <aside class="md:w-80 shrink-0 border border-line rounded-lg flex flex-col bg-surface-1 min-h-0" aria-label="Conversaciones">
        @if (list.isLoading() && !list.hasValue()) {
          <div class="flex justify-center py-8"><span uiSpinner></span></div>
        } @else {
          <ul class="flex-1 overflow-y-auto p-2 grid content-start gap-1">
            @for (c of list.value() ?? []; track c.id) {
              <li>
                <a
                  [routerLink]="['/communication/direct', c.id]"
                  class="flex items-start gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-2"
                  [class.bg-action-subtle]="c.id === id()"
                  [attr.aria-current]="c.id === id() ? 'page' : null"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block font-medium text-ink-strong truncate">{{ c.counterpart.name }}</span>
                    @if (c.student) {
                      <span class="block text-xs text-ink-muted truncate">Sobre {{ c.student.name }}</span>
                    }
                    <span class="block text-xs text-ink-muted truncate">{{ c.lastMessagePreview }}</span>
                  </span>
                  <span class="flex flex-col items-end gap-1 shrink-0">
                    <span class="text-[11px] text-ink-muted">{{ c.lastMessageAt | date: 'short' }}</span>
                    @if (c.unread > 0) {
                      <span uiBadge tone="new" size="sm">{{ c.unread }}</span>
                    }
                  </span>
                </a>
              </li>
            } @empty {
              <li class="text-center text-sm text-ink-muted py-6">Aún no hay conversaciones.</li>
            }
          </ul>
        }
      </aside>

      <section class="flex-1 border border-line rounded-lg flex flex-col bg-surface-1 min-w-0 min-h-96">
        @if (picking()) {
          <div class="p-4 grid gap-3 content-start overflow-y-auto">
            <div class="flex items-center justify-between gap-2">
              <h2 class="type-label text-ink-strong">Nuevo mensaje</h2>
              <button uiButton variant="ghost" size="sm" type="button" (click)="picking.set(false)">Cancelar</button>
            </div>
            <input
              uiInput
              type="search"
              aria-label="Buscar estudiante o acudiente"
              placeholder="Buscar estudiante o acudiente…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
            />
            @if (recipients.isLoading()) {
              <div class="flex justify-center py-4"><span uiSpinner size="sm"></span></div>
            } @else {
              <ul class="grid gap-2">
                @for (r of recipients.value() ?? []; track r.student.id) {
                  <li class="rounded-lg border border-line p-3">
                    <p class="font-medium text-ink-strong">
                      {{ r.student.name }}
                      @if (r.student.group) {
                        <span class="text-xs text-ink-muted"> · {{ r.student.group }}</span>
                      }
                    </p>
                    <div class="flex flex-wrap gap-2 mt-2">
                      @for (p of r.parents; track p.id) {
                        <button uiButton variant="secondary" size="sm" type="button" [disabled]="starting()" (click)="start(p.id, r.student.id)">
                          <ui-icon name="message-circle" /> {{ p.name }}
                        </button>
                      }
                    </div>
                  </li>
                } @empty {
                  <li class="text-sm text-ink-muted">No hay acudientes con cuenta que coincidan.</li>
                }
              </ul>
            }
          </div>
        } @else if (id()) {
          @if (conversation.isLoading() && !conversation.hasValue()) {
            <div class="flex justify-center py-12"><span uiSpinner></span></div>
          } @else if (conversation.error()) {
            <div class="p-4">
              <lib-empty-state title="Conversación no disponible" icon="circle-alert" color="warning" />
            </div>
          } @else if (conversation.value(); as c) {
            <header class="p-3 border-b border-line">
              <h2 class="font-semibold text-ink-strong">{{ c.counterpart.name }}</h2>
              @if (c.student) {
                <p class="text-sm text-ink-muted">Sobre {{ c.student.name }}</p>
              }
            </header>
            <lib-thread-scroll-pane [itemCount]="c.messages.length" [lastIsMine]="lastIsMine()" [resetKey]="c.id">
              @for (m of c.messages; track m.id) {
                <lib-message-bubble
                  [body]="m.body"
                  [senderName]="m.sender?.name ?? ''"
                  [sentAt]="(m.createdAt | date: 'short') + (m.mine && m.readByCounterpart ? ' · Leído' : '')"
                  [mine]="m.mine"
                />
              } @empty {
                <p class="text-sm text-ink-muted text-center py-6">
                  {{ c.side === 'STAFF' ? 'Escribe el primer mensaje.' : 'Sin mensajes todavía.' }}
                </p>
              }
            </lib-thread-scroll-pane>
            <lib-thread-composer [disabled]="sending()" (send)="send($event)" />
          }
        } @else {
          <div class="p-4">
            <lib-empty-state
              title="Elige una conversación"
              [description]="isStaff() ? 'O empieza una nueva con un acudiente.' : 'Aquí verás los mensajes que te envíe la escuela.'"
              icon="message-circle"
              [actionLabel]="isStaff() ? 'Nuevo mensaje' : undefined"
              (action)="picking.set(true)"
            />
          </div>
        }
      </section>
    </div>
  `,
})
export default class Direct {
  #api = inject(CommunicationApi);
  #auth = inject(Auth);
  #router = inject(Router);
  #toast = inject(Toast);

  /** Route param on /communication/direct/:id. */
  readonly id = input<string>();

  readonly isStaff = computed(() => !this.#auth.isParent() && !this.#auth.isStudent());
  readonly picking = signal(false);
  readonly query = signal('');
  readonly starting = signal(false);
  readonly sending = signal(false);

  readonly list = httpResource<DirectConversationSummary[]>(() => `${API}/direct`, { defaultValue: [] });

  readonly conversation = httpResource<DirectConversationDetail>(() => {
    const id = this.id();
    return id ? `${API}/direct/${id}` : undefined;
  });

  readonly lastIsMine = computed(() => {
    const messages = this.conversation.value()?.messages ?? [];
    return !!messages[messages.length - 1]?.mine;
  });

  readonly recipients = resource({
    params: () => (this.picking() ? { q: this.query().trim() } : undefined),
    loader: async ({ params, abortSignal }): Promise<DirectRecipient[]> => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (abortSignal.aborted) return [];
      return this.#api.recipients(params.q);
    },
  });

  constructor() {
    // Opening a conversation marks it read on the server; refresh the list and the sidebar badge.
    effect(() => {
      if (this.conversation.hasValue()) {
        this.list.reload();
        this.#api.refreshUnread();
      }
    });
    effect(() => {
      if (this.id()) this.picking.set(false);
    });
    const timer = setInterval(() => {
      this.list.reload();
      if (this.id()) this.conversation.reload();
    }, REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async start(parentUserId: string, studentId: string) {
    this.starting.set(true);
    try {
      const c = await this.#api.startDirect(parentUserId, studentId);
      this.picking.set(false);
      this.query.set('');
      this.list.reload();
      this.#router.navigate(['/communication/direct', c.id]);
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    } finally {
      this.starting.set(false);
    }
  }

  async send(body: string) {
    const id = this.id();
    if (!id) return;
    this.sending.set(true);
    try {
      await this.#api.sendDirect(id, body);
      this.conversation.reload();
      this.list.reload();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    } finally {
      this.sending.set(false);
    }
  }
}
