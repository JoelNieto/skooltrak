import { Badge, Button, EmptyState, Icon, Loader, PageHeader, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NotificationsBadge } from './notifications-badge';

/** `GET /api/v1/notifications` (ASM-001-S08). */
interface NotificationList {
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
  unread: number;
}

/**
 * The caller's notifications, newest first (ASM-001-S08): homeroom alerts, unpublished-grade
 * reminders, join requests. Opening one marks it read; "Marcar todo como leído" clears the badge.
 */
@Component({
  selector: 'app-notifications-page',
  imports: [Badge, Button, DatePipe, EmptyState, Icon, Loader, PageHeader],
  template: `
    <lib-page-header
      title="Notificaciones"
      [subtitle]="unread() ? (unread() === 1 ? '1 sin leer' : unread() + ' sin leer') : 'Estás al día.'"
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Notificaciones' }]"
    />
    @if (unread()) {
      <div class="mb-4 flex justify-end">
        <button uiButton variant="ghost" size="sm" type="button" (click)="markAllRead()">
          <ui-icon name="check-check" />
          Marcar todo como leído
        </button>
      </div>
    }
    @if (list.isLoading() && !list.hasValue()) {
      <lib-loader />
    } @else if (list.error()) {
      <lib-empty-state title="No se pudieron cargar tus notificaciones" description="Inténtalo de nuevo más tarde." icon="circle-alert" />
    } @else if (!items().length) {
      <lib-empty-state title="Sin notificaciones" description="Aquí verás los avisos que te envíe la plataforma." icon="bell" />
    } @else {
      <ul class="flex flex-col gap-2" aria-label="Notificaciones">
        @for (item of items(); track item.id) {
          <li>
            <button
              type="button"
              class="flex w-full items-start gap-3 rounded-box border border-line p-4 text-start hover:bg-surface-2"
              [class.bg-surface-1]="item.read"
              [class.bg-action-subtle]="!item.read"
              [attr.aria-label]="(item.read ? '' : 'Sin leer: ') + item.title"
              (click)="markRead(item.id, item.read)"
            >
              <ui-icon [name]="item.read ? 'bell' : 'bell-ring'" class="mt-0.5 text-xl text-ink-muted" />
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-ink-strong">{{ item.title }}</span>
                  @if (!item.read) {
                    <span uiBadge tone="new" size="sm">Nueva</span>
                  }
                </span>
                <span class="mt-1 block text-sm text-ink">{{ item.message }}</span>
                <span class="mt-1 block text-xs text-ink-muted">{{ item.createdAt | date: 'short' }}</span>
              </span>
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export default class NotificationsPage {
  #http = inject(HttpClient);
  #toast = inject(Toast);
  #badge = inject(NotificationsBadge);

  public readonly list = httpResource<NotificationList>(() => '/api/v1/notifications');
  protected readonly items = computed(() => this.list.value()?.notifications ?? []);
  protected readonly unread = computed(() => this.list.value()?.unread ?? 0);

  protected async markRead(id: string, read: boolean): Promise<void> {
    if (read) return;
    try {
      await firstValueFrom(this.#http.patch(`/api/v1/notifications/${id}/read`, {}));
      this.list.reload();
      this.#badge.refresh();
    } catch {
      this.#toast.showError('No se pudo marcar la notificación como leída');
    }
  }

  protected async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.#http.patch('/api/v1/notifications/read', {}));
      this.list.reload();
      this.#badge.refresh();
    } catch {
      this.#toast.showError('No se pudieron marcar las notificaciones como leídas');
    }
  }
}
