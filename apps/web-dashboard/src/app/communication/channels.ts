import { Badge, EmptyState, Icon, PageHeader, Spinner } from '#/ui';
import { CHANNEL_SCOPE_LABELS, ChannelSummary } from '@/shared';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Auth from '../auth/auth';

/** COM-003 FR .11: the channels the caller manages, then the ones they belong to. */
@Component({
  selector: 'app-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, RouterLink, Badge, Icon, Spinner, EmptyState, DatePipe],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Canales' }]"
      title="Canales"
      [subtitle]="
        canCreate()
          ? 'Publica avisos para una organización, escuela, plan, grupo o curso, y mira quién los leyó.'
          : 'Avisos de tu escuela, tus grupos y tus cursos.'
      "
      [actionLabel]="canCreate() ? 'Nuevo canal' : undefined"
      actionIcon="plus"
      (action)="create()"
    />

    @if (channels.isLoading() && !channels.hasValue()) {
      <div class="flex justify-center py-12"><span uiSpinner></span></div>
    } @else if (channels.error()) {
      <lib-empty-state title="No se pudieron cargar los canales" icon="circle-alert" color="warning" />
    } @else if (!all().length) {
      <lib-empty-state
        title="Aún no hay canales"
        [description]="canCreate() ? 'Crea el primero para tu curso o grupo.' : 'Cuando tu escuela publique avisos, aparecerán aquí.'"
        icon="megaphone"
        [actionLabel]="canCreate() ? 'Nuevo canal' : undefined"
        (action)="create()"
      />
    } @else {
      @for (section of sections(); track section.title) {
        @if (section.items.length) {
          <section class="mb-6" [attr.aria-labelledby]="section.id">
            <h2 [id]="section.id" class="type-label text-ink-muted mb-2">{{ section.title }}</h2>
            <ul class="grid gap-2">
              @for (c of section.items; track c.id) {
                <li>
                  <a
                    [routerLink]="['/communication/channels', c.id]"
                    class="flex items-start gap-3 rounded-lg border border-line bg-surface-1 p-3 transition-colors hover:border-primary"
                    [class.opacity-70]="c.archived"
                  >
                    <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-action-subtle">
                      <ui-icon name="megaphone" class="text-primary text-lg" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="flex flex-wrap items-center gap-2">
                        <span class="font-semibold text-ink-strong truncate">{{ c.name }}</span>
                        <span uiBadge size="sm">{{ scopeLabel(c) }} · {{ c.targetName }}</span>
                        @if (c.archived) {
                          <span uiBadge size="sm" tone="warning">Archivado</span>
                        }
                      </span>
                      <span class="block text-sm text-ink-muted truncate mt-0.5">
                        {{ c.lastPostPreview ?? 'Sin publicaciones todavía' }}
                      </span>
                    </span>
                    <span class="flex flex-col items-end gap-1 shrink-0">
                      @if (c.lastPostAt) {
                        <span class="text-xs text-ink-muted">{{ c.lastPostAt | date: 'short' }}</span>
                      }
                      @if (c.unread > 0) {
                        <span uiBadge tone="new" size="sm" [attr.aria-label]="c.unread + ' sin leer'">{{ c.unread }}</span>
                      }
                    </span>
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      }
    }
  `,
})
export default class Channels {
  #auth = inject(Auth);
  #router = inject(Router);

  readonly channels = httpResource<ChannelSummary[]>(() => '/api/v1/communication/channels', { defaultValue: [] });
  readonly all = computed(() => this.channels.value() ?? []);
  readonly canCreate = computed(() => this.#auth.hasPermission('COMMUNICATION_CHANNELS') && !this.#auth.isParent() && !this.#auth.isStudent());

  readonly sections = computed(() => [
    { id: 'managed-title', title: 'Canales que administras', items: this.all().filter((c) => c.role === 'MANAGER') },
    { id: 'member-title', title: 'Tus canales', items: this.all().filter((c) => c.role === 'MEMBER') },
  ]);

  scopeLabel(c: ChannelSummary) {
    return CHANNEL_SCOPE_LABELS[c.scope];
  }

  create() {
    this.#router.navigate(['/communication/channels/new']);
  }
}
