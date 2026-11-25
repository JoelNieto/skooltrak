import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Confirmation,
  EmptyState,
  Icon,
  PageHeader,
  Spinner,
  Toast,
  UiCheckbox,
  UiChoice,
  UiInput,
} from '#/ui';
import { CHANNEL_SCOPE_LABELS, ChannelDetail, ChannelPost } from '@/shared';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  resource,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from './channel-form';
import { ChannelReceipts, ChannelReplies } from './channel-replies';
import { CommunicationApi } from './communication-api';

const REFRESH_MS = 30_000;

/**
 * COM-003 channel page. Managers publish posts (optionally asking for a read confirmation) and see
 * read and confirmation counts per post (FR .6, .9). Members read, confirm and reply (FR .8, .10).
 * `embedded` shows it inside another page, e.g. a course's Canales tab (ACA-001 FR .26, BR .20): a
 * compact header with "Abrir en pantalla completa" instead of the page header and breadcrumbs.
 */
@Component({
  selector: 'app-channel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    Card,
    CardBody,
    Badge,
    Button,
    Icon,
    Spinner,
    EmptyState,
    Alert,
    UiInput,
    UiChoice,
    UiCheckbox,
    FormsModule,
    DatePipe,
    ChannelReplies,
    ChannelReceipts,
    RouterLink,
  ],
  template: `
    @if (detail.isLoading() && !detail.hasValue()) {
      <div class="flex justify-center py-12"><span uiSpinner></span></div>
    } @else if (detail.error()) {
      <lib-empty-state
        title="Canal no disponible"
        description="No existe o ya no formas parte de él."
        icon="circle-alert"
        color="warning"
      />
    } @else if (detail.value(); as c) {
      @if (embedded()) {
        <header class="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-ink-strong">{{ c.name }}</h2>
            @if (c.description) {
              <p class="text-sm text-ink-muted">{{ c.description }}</p>
            }
          </div>
          <div class="flex flex-wrap gap-2">
            @if (manager()) {
              <button uiButton variant="ghost" size="sm" type="button" (click)="edit()">
                <ui-icon name="settings" />
                Configurar
              </button>
            }
            <a uiButton variant="ghost" size="sm" [routerLink]="['/communication/channels', c.id]">
              <ui-icon name="external-link" />
              Abrir en pantalla completa
            </a>
          </div>
        </header>
      } @else {
        <lib-page-header
          [breadcrumbs]="[
            { label: 'Inicio', link: '/' },
            { label: 'Canales', link: '/communication/channels' },
            { label: c.name },
          ]"
          [title]="c.name"
          [subtitle]="scopeLabels[c.scope] + ' · ' + c.targetName + (c.description ? ' — ' + c.description : '')"
          [actionLabel]="manager() ? 'Configurar' : undefined"
          actionIcon="settings"
          (action)="edit()"
        />
      }

      <div class="flex flex-wrap gap-2 mb-4">
        <span uiBadge size="sm">{{ audienceLabel(c) }}</span>
        @if (c.closesAt && !c.archived) {
          <!-- COM-003 FR .18: an assignment's Q&A channel closes 3 days after its latest due date. -->
          <span uiBadge tone="warning" size="sm">Cierra el {{ c.closesAt | date: 'dd/MM/yyyy' }}</span>
        }
        <span uiBadge size="sm">{{ repliesLabel(c) }}</span>
        @if (c.studentsCanReply || c.parentsCanReply) {
          <span uiBadge size="sm">{{
            c.replyVisibility === 'PRIVATE' ? 'Respuestas privadas' : 'Respuestas públicas'
          }}</span>
        }
      </div>

      @if (c.archived) {
        <div uiAlert tone="warning" class="mb-4">
          @if (closedOn(c); as closed) {
            Este canal de preguntas cerró el {{ closed | date: 'dd/MM/yyyy' }}: se puede leer, pero no admite
            publicaciones ni respuestas.
          } @else {
            Este canal está archivado: se puede leer, pero no admite publicaciones ni respuestas.
          }
        </div>
      }

      @if (manager() && !c.archived) {
        <form uiCard class="mb-6" (submit)="publish($event)" aria-labelledby="compose-title">
          <div uiCardBody class="grid gap-3">
            <h2 id="compose-title" class="type-label text-ink-strong">Nueva publicación</h2>
            <textarea
              uiInput
              id="post-body"
              name="body"
              rows="4"
              aria-label="Mensaje"
              placeholder="Escribe el aviso…"
              [ngModel]="draft()"
              (ngModelChange)="draft.set($event)"
            ></textarea>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <ui-choice label="Requiere confirmación de lectura">
                <input
                  uiCheckbox
                  type="checkbox"
                  id="post-confirm"
                  name="confirm"
                  [ngModel]="requireConfirmation()"
                  (ngModelChange)="requireConfirmation.set($event)"
                />
              </ui-choice>
              <button
                uiButton
                variant="primary"
                type="submit"
                [disabled]="!draft().trim() || publishing()"
                [loading]="publishing()"
              >
                <ui-icon name="send" /> Publicar
              </button>
            </div>
          </div>
        </form>
      }

      <section aria-label="Publicaciones" class="grid gap-4">
        @for (p of c.posts; track p.id) {
          <article uiCard [attr.aria-label]="'Publicación de ' + (p.author?.name ?? '—')">
            <div uiCardBody class="grid gap-3">
              <header class="flex flex-wrap items-center gap-2 text-sm">
                <span class="font-semibold text-ink-strong">{{ p.author?.name ?? '—' }}</span>
                <span class="text-ink-muted">{{ p.createdAt | date: 'medium' }}</span>
                @if (!manager() && !p.readAt && unreadIds().has(p.id)) {
                  <span uiBadge tone="new" size="sm">Nuevo</span>
                }
                @if (p.pinned) {
                  <!-- COM-003 FR .17: the opening post of an assignment's Q&A channel. -->
                  <span uiBadge tone="action" size="sm"><ui-icon name="pin" /> Fijado</span>
                }
                @if (p.requiresConfirmation) {
                  <span uiBadge tone="info" size="sm">Requiere confirmación</span>
                }
                @if (manager()) {
                  <button
                    uiButton
                    variant="ghost"
                    size="sm"
                    iconOnly
                    type="button"
                    class="ml-auto"
                    aria-label="Eliminar publicación"
                    (click)="remove(p)"
                  >
                    <ui-icon name="trash-2" />
                  </button>
                }
              </header>
              <p class="whitespace-pre-wrap break-words text-ink-strong">{{ p.body }}</p>

              @if (p.stats; as s) {
                <div class="flex flex-wrap items-center gap-3 text-sm">
                  <span class="inline-flex items-center gap-1 text-ink-muted">
                    <ui-icon name="eye" /> Leído por {{ s.read }} de {{ s.audience }}
                  </span>
                  @if (p.requiresConfirmation) {
                    <span class="inline-flex items-center gap-1 text-ink-muted">
                      <ui-icon name="check-check" /> Confirmado por {{ s.confirmed }} de {{ s.audience }}
                    </span>
                  }
                  <button
                    uiButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    [attr.aria-expanded]="openReceipts() === p.id"
                    (click)="toggle(openReceipts, p.id)"
                  >
                    {{ openReceipts() === p.id ? 'Ocultar detalle' : 'Ver detalle' }}
                  </button>
                </div>
                @if (openReceipts() === p.id) {
                  <app-channel-receipts
                    [channelId]="c.id"
                    [postId]="p.id"
                    [requiresConfirmation]="p.requiresConfirmation"
                  />
                }
              } @else if (p.requiresConfirmation) {
                @if (p.confirmedAt) {
                  <p class="inline-flex items-center gap-1 text-sm text-success">
                    <ui-icon name="circle-check" /> Confirmaste la lectura el {{ p.confirmedAt | date: 'short' }}
                  </p>
                } @else {
                  <div>
                    <button
                      uiButton
                      variant="primary"
                      size="sm"
                      type="button"
                      [loading]="confirming() === p.id"
                      (click)="confirm(p)"
                    >
                      <ui-icon name="check" /> Confirmar lectura
                    </button>
                  </div>
                }
              }

              @if (p.replyCount || c.canReply) {
                <div>
                  <button
                    uiButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    [attr.aria-expanded]="openReplies() === p.id"
                    (click)="toggle(openReplies, p.id)"
                  >
                    <ui-icon name="message-circle" />
                    {{ p.replyCount ? 'Respuestas (' + p.replyCount + ')' : 'Responder' }}
                  </button>
                </div>
                @if (openReplies() === p.id) {
                  <app-channel-replies
                    [channelId]="c.id"
                    [postId]="p.id"
                    [manager]="manager()"
                    [canReply]="c.canReply"
                    [visibility]="c.replyVisibility"
                    (changed)="detail.reload(); changed.emit()"
                  />
                }
              }
            </div>
          </article>
        } @empty {
          <lib-empty-state
            title="Sin publicaciones"
            [description]="
              manager() ? 'Escribe el primer aviso para este canal.' : 'Cuando haya avisos, aparecerán aquí.'
            "
            icon="megaphone"
          />
        }
      </section>
    }
  `,
})
export default class Channel {
  #api = inject(CommunicationApi);
  #router = inject(Router);
  #toast = inject(Toast);
  #confirmation = inject(Confirmation);

  /** Route param, or the host's chosen channel when embedded. */
  readonly id = input.required<string>();
  /** ACA-001 BR .20: shown inside another page (no page header or breadcrumbs). */
  readonly embedded = input(false);
  /** Fires once the posts were marked read, so a host can refresh its counts (ACA-001 FR .26). */
  readonly read = output<void>();
  /** Fires after a reply is sent, so a host can refresh counts such as "por responder" (ACA-001 FR .28). */
  readonly changed = output<void>();

  readonly scopeLabels = CHANNEL_SCOPE_LABELS;
  readonly draft = signal('');
  readonly requireConfirmation = signal(false);
  readonly publishing = signal(false);
  readonly confirming = signal<string | null>(null);
  readonly openReplies = signal<string | null>(null);
  readonly openReceipts = signal<string | null>(null);
  /** Posts that were unread when the page opened, so the "Nuevo" badge survives marking them read. */
  readonly unreadIds = signal(new Set<string>());

  readonly detail = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }): Promise<ChannelDetail> => this.#api.channel(params.id),
  });

  readonly manager = computed(() => this.detail.value()?.role === 'MANAGER');

  constructor() {
    // FR .8: opening the channel marks its posts read.
    let markedFor: string | null = null;
    effect(() => {
      const c = this.detail.value();
      if (!c || c.role !== 'MEMBER' || markedFor === c.id) return;
      markedFor = c.id;
      this.unreadIds.set(new Set(c.posts.filter((p) => !p.readAt).map((p) => p.id)));
      if (c.unread > 0) void this.#api.markChannelRead(c.id).then(() => this.read.emit());
    });
    const timer = setInterval(() => this.detail.reload(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** COM-003 BR .11: when a closed channel closed by its close time (not by being archived). */
  closedOn(c: ChannelDetail): string | null {
    return c.closesAt && new Date(c.closesAt) <= new Date() ? c.closesAt : null;
  }

  audienceLabel(c: ChannelDetail) {
    if (c.audienceStudents && c.audienceParents) return 'Estudiantes y acudientes';
    return c.audienceStudents ? 'Estudiantes' : 'Acudientes';
  }

  repliesLabel(c: ChannelDetail) {
    if (c.studentsCanReply && c.parentsCanReply) return 'Estudiantes y acudientes pueden responder';
    if (c.studentsCanReply) return 'Estudiantes pueden responder';
    if (c.parentsCanReply) return 'Acudientes pueden responder';
    return 'Solo avisos';
  }

  toggle(state: ReturnType<typeof signal<string | null>>, id: string) {
    state.set(state() === id ? null : id);
  }

  edit() {
    this.#router.navigate(['/communication/channels', this.id(), 'edit']);
  }

  async publish(event: Event) {
    event.preventDefault();
    const body = this.draft().trim();
    if (!body || this.publishing()) return;
    this.publishing.set(true);
    try {
      await this.#api.createPost(this.id(), body, this.requireConfirmation());
      this.draft.set('');
      this.requireConfirmation.set(false);
      this.#toast.showSuccess('Publicado');
      this.detail.reload();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    } finally {
      this.publishing.set(false);
    }
  }

  async confirm(post: ChannelPost) {
    this.confirming.set(post.id);
    try {
      await this.#api.confirm(this.id(), post.id);
      this.#api.refreshUnread();
      this.detail.reload();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    } finally {
      this.confirming.set(null);
    }
  }

  async remove(post: ChannelPost) {
    const ok = await firstValueFrom(
      this.#confirmation.confirm({
        title: 'Eliminar publicación',
        message: 'Los miembros dejarán de verla. Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        severity: 'error',
      }),
    );
    if (!ok) return;
    try {
      await this.#api.deletePost(this.id(), post.id);
      this.detail.reload();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    }
  }
}
