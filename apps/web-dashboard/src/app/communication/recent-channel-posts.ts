import { Badge, Card, CardBody, EmptyState, Icon, Spinner } from '#/ui';
import { RecentChannelPost } from '@/shared';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** COM-003 FR .16: the latest posts of the caller's channels, on every home page. */
@Component({
  selector: 'app-recent-channel-posts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, CardBody, Badge, Icon, Spinner, EmptyState, RouterLink, DatePipe],
  template: `
    <section uiCard aria-labelledby="recent-posts-title">
      <div uiCardBody>
        <div class="flex items-center justify-between gap-3">
          <h2 id="recent-posts-title" class="text-lg font-semibold text-ink-strong flex items-center gap-2">
            <ui-icon name="megaphone" class="text-primary" />
            Canales
          </h2>
          <a routerLink="/communication/channels" class="link link-primary text-sm">Ver todos</a>
        </div>
        @if (posts.isLoading() && !posts.hasValue()) {
          <div class="flex justify-center py-8"><span uiSpinner></span></div>
        } @else if (!(posts.value() ?? []).length) {
          <lib-empty-state title="Sin avisos recientes" description="Las publicaciones de tus canales aparecerán aquí." icon="megaphone" />
        } @else {
          <ul class="grid gap-2 mt-1">
            @for (p of posts.value(); track p.id) {
              <li>
                <a
                  [routerLink]="['/communication/channels', p.channelId]"
                  class="block rounded-lg border border-line p-3 transition-colors hover:border-primary"
                >
                  <span class="flex flex-wrap items-center gap-2">
                    <span class="font-medium text-ink-strong truncate">{{ p.channelName }}</span>
                    @if (p.unread) {
                      <span uiBadge tone="new" size="sm">Nuevo</span>
                    }
                    @if (p.requiresConfirmation && !p.confirmed) {
                      <span uiBadge tone="info" size="sm">Por confirmar</span>
                    }
                  </span>
                  <span class="block text-sm text-ink-muted line-clamp-2 mt-1">{{ p.body }}</span>
                  <span class="block text-xs text-ink-muted mt-1">{{ p.author?.name }} · {{ p.createdAt | date: 'short' }}</span>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class RecentChannelPosts {
  readonly posts = httpResource<RecentChannelPost[]>(() => '/api/v1/communication/channels/recent?take=5', {
    defaultValue: [],
  });
}
