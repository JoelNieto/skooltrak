import { Alert, Badge, Button, EmptyState, Icon, Skeleton, TimeAgoPipe } from '#/ui';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseChannel, newCount } from './course-channels';

/**
 * A course's channels for students and parents (ACA-001 FR .21): name and kind, the latest post and
 * its time, and the unread count. A row opens the COM-003 channel page, which marks its posts read.
 * `compact` is the Resumen card (FR .22): at most 3 open channels and no empty state.
 */
@Component({
  selector: 'app-course-channels-list',
  imports: [Alert, Badge, Button, EmptyState, Icon, RouterLink, Skeleton, TimeAgoPipe],
  template: `
    @if (error()) {
      <div uiAlert tone="danger" role="alert">
        <span>No se pudieron cargar los canales del curso.</span>
        <button uiButton variant="ghost" size="sm" type="button" (click)="retry.emit()">Reintentar</button>
      </div>
    } @else if (loading()) {
      <div class="flex flex-col gap-3" aria-busy="true">
        @for (i of [1, 2]; track i) {
          <span uiSkeleton class="block h-12 w-full"></span>
        }
      </div>
    } @else if (shown().length) {
      <ul class="flex flex-col" aria-label="Canales del curso">
        @for (channel of shown(); track channel.id) {
          <li class="border-t border-line first:border-t-0">
            <a
              [routerLink]="['/communication/channels', channel.id]"
              class="flex items-start gap-3 py-2.5 hover:bg-surface-2"
            >
              <ui-icon
                [name]="channel.kind === 'Solo anuncios' ? 'megaphone' : 'message-circle'"
                class="mt-0.5 text-xl text-ink-muted"
              />
              <span class="min-w-0 flex-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="truncate font-medium text-ink-strong">{{ channel.name }}</span>
                  @if (channel.lastPostAt) {
                    <span class="shrink-0 text-xs text-ink-muted">{{ channel.lastPostAt | timeAgo }}</span>
                  }
                </span>
                <span class="block text-xs text-ink-muted">{{ channel.kind }}</span>
                <span class="flex items-center justify-between gap-2">
                  <span class="truncate text-sm text-ink">{{ channel.lastPostPreview ?? 'Sin publicaciones' }}</span>
                  @if (channel.archived) {
                    <span uiBadge size="sm">Archivado</span>
                  } @else if (channel.unread) {
                    <span uiBadge tone="new" size="sm">{{ count(channel.unread) }}</span>
                  }
                </span>
              </span>
            </a>
          </li>
        }
      </ul>
    } @else if (!compact()) {
      <lib-empty-state
        title="Este curso aún no tiene canales"
        description="Cuando tu docente cree un canal para el curso, aparecerá aquí."
        icon="message-circle"
      />
    }
  `,
})
export class CourseChannelsList {
  readonly channels = input<CourseChannel[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  /** The Resumen card (FR .22). */
  readonly compact = input(false);
  readonly retry = output<void>();

  protected readonly shown = computed(() =>
    this.compact()
      ? this.channels()
          .filter((c) => !c.archived)
          .slice(0, 3)
      : this.channels(),
  );
  protected readonly count = newCount;
}
