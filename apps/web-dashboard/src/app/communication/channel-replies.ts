import { Button, MessageBubble, Spinner, ThreadComposer, Toast } from '#/ui';
import { ChannelReceipt, ChannelReplyThread, ChannelReplyVisibilityKey } from '@/shared';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, resource, signal } from '@angular/core';
import Auth from '../auth/auth';
import { errorMessage } from './channel-form';
import { CommunicationApi } from './communication-api';

/**
 * COM-003 FR .10 / BR .5: a post's replies. PUBLIC channels show one list; PRIVATE channels show the
 * member their own conversation, and the managers one conversation per member.
 */
@Component({
  selector: 'app-channel-replies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageBubble, ThreadComposer, Spinner, DatePipe],
  template: `
    @if (threads.isLoading() && !threads.hasValue()) {
      <div class="flex justify-center py-4"><span uiSpinner size="sm"></span></div>
    } @else {
      @if (visibility() === 'PRIVATE') {
        <p class="text-xs text-ink-muted mb-2">
          {{ manager() ? 'Respuestas privadas: cada miembro solo ve su conversación contigo.' : 'Tu respuesta solo la ven los administradores del canal.' }}
        </p>
      }
      @for (thread of visibleThreads(); track thread.member?.id ?? 'public') {
        <div class="rounded-lg border border-line bg-surface-0 mb-3">
          @if (manager() && thread.member) {
            <p class="px-3 pt-2 type-label text-ink-strong">{{ thread.member.name }}</p>
          }
          <div class="p-3 space-y-2">
            @for (r of thread.replies; track r.id) {
              <lib-message-bubble
                [body]="r.body"
                [senderName]="(r.author?.name ?? '—') + (r.fromManager ? ' · Administrador del canal' : '')"
                [sentAt]="(r.createdAt | date: 'short') ?? ''"
                [mine]="r.author?.id === me()"
              />
            } @empty {
              <p class="text-sm text-ink-muted">Sin respuestas todavía.</p>
            }
          </div>
          @if (canReply() && (visibility() === 'PUBLIC' || !manager() || thread.member)) {
            <lib-thread-composer
              [placeholder]="manager() && thread.member ? 'Responder a ' + thread.member.name + '…' : 'Escribe una respuesta…'"
              (send)="send($event, manager() ? thread.member?.id : undefined)"
            />
          }
        </div>
      } @empty {
        @if (!canReply()) {
          <p class="text-sm text-ink-muted">Sin respuestas todavía.</p>
        }
      }
      @if (showStarter()) {
        <div class="rounded-lg border border-line bg-surface-0">
          <lib-thread-composer placeholder="Escribe una respuesta…" (send)="send($event)" />
        </div>
      }
    }
  `,
})
export class ChannelReplies {
  #api = inject(CommunicationApi);
  #auth = inject(Auth);
  #toast = inject(Toast);

  readonly channelId = input.required<string>();
  readonly postId = input.required<string>();
  readonly manager = input(false);
  readonly canReply = input(false);
  readonly visibility = input<ChannelReplyVisibilityKey>('PRIVATE');
  readonly changed = output<void>();

  readonly me = computed(() => this.#auth.user()?.userId ?? null);

  readonly threads = resource({
    params: () => ({ channel: this.channelId(), post: this.postId() }),
    loader: ({ params }): Promise<ChannelReplyThread[]> => this.#api.replies(params.channel, params.post),
  });

  readonly visibleThreads = computed(() => (this.threads.value() ?? []).filter((t) => t.replies.length || t.member === null));

  /** A member (or a public channel) with nothing yet: a composer to start. */
  readonly showStarter = computed(
    () => this.canReply() && !this.visibleThreads().length && (this.visibility() === 'PUBLIC' || !this.manager()),
  );

  async send(body: string, threadUserId?: string) {
    try {
      await this.#api.reply(this.channelId(), this.postId(), body, threadUserId);
      this.threads.reload();
      this.changed.emit();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    }
  }
}

/** COM-003 FR .9: who read and who confirmed a post. */
@Component({
  selector: 'app-channel-receipts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner, DatePipe, Button],
  template: `
    @if (receipts.isLoading() && !receipts.hasValue()) {
      <div class="flex justify-center py-4"><span uiSpinner size="sm"></span></div>
    } @else if (receipts.error()) {
      <p class="text-sm text-error">No se pudo cargar el detalle.</p>
    } @else {
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <button uiButton size="sm" type="button" [variant]="pendingOnly() ? 'secondary' : 'primary'" (click)="pendingOnly.set(false)">
          Todos ({{ all().length }})
        </button>
        <button uiButton size="sm" type="button" [variant]="pendingOnly() ? 'primary' : 'secondary'" (click)="pendingOnly.set(true)">
          {{ requiresConfirmation() ? 'Sin confirmar' : 'Sin leer' }} ({{ pending().length }})
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">Lecturas de la publicación</caption>
          <thead>
            <tr class="text-left text-ink-muted">
              <th scope="col" class="py-1 pr-3 font-medium">Nombre</th>
              <th scope="col" class="py-1 pr-3 font-medium">Leído</th>
              @if (requiresConfirmation()) {
                <th scope="col" class="py-1 font-medium">Confirmado</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.user.id) {
              <tr class="border-t border-line">
                <td class="py-1.5 pr-3">
                  <span class="text-ink-strong">{{ r.user.name }}</span>
                  <span class="block text-xs text-ink-muted">
                    {{ r.kind === 'STUDENT' ? 'Estudiante' : 'Acudiente' + (r.students.length ? ' de ' + r.students.join(', ') : '') }}
                  </span>
                </td>
                <td class="py-1.5 pr-3">{{ r.readAt ? (r.readAt | date: 'short') : '—' }}</td>
                @if (requiresConfirmation()) {
                  <td class="py-1.5">{{ r.confirmedAt ? (r.confirmedAt | date: 'short') : '—' }}</td>
                }
              </tr>
            } @empty {
              <tr><td class="py-2 text-ink-muted" colspan="3">Nadie en esta lista.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ChannelReceipts {
  #api = inject(CommunicationApi);

  readonly channelId = input.required<string>();
  readonly postId = input.required<string>();
  readonly requiresConfirmation = input(false);

  readonly pendingOnly = signal(false);

  readonly receipts = resource({
    params: () => ({ channel: this.channelId(), post: this.postId() }),
    loader: ({ params }): Promise<ChannelReceipt[]> => this.#api.receipts(params.channel, params.post),
  });

  readonly all = computed(() => this.receipts.value() ?? []);
  readonly pending = computed(() =>
    this.all().filter((r) => (this.requiresConfirmation() ? !r.confirmedAt : !r.readAt)),
  );
  readonly rows = computed(() => (this.pendingOnly() ? this.pending() : this.all()));
}
