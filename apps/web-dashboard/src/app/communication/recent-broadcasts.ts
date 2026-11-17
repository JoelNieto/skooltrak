import { Badge, Card, CardBody, EmptyState, Icon, Spinner } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { Thread } from './communication-api.service';

type BroadcastCardItem = {
  id: string;
  title: string;
  preview: string;
  senderName: string;
  createdAt?: string;
  urgent: boolean;
  repliesAllowed: boolean;
};

@Component({
  selector: 'app-broadcast-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, DatePipe, Icon],
  template: `
    <div class="flex items-start justify-between gap-2">
      <p class="font-medium text-ink-strong flex items-center gap-2 min-w-0">
        <ui-icon name="megaphone" class="text-primary text-lg shrink-0" />
        <span class="truncate">{{ item().title }}</span>
      </p>
      <span uiBadge tone="action" size="sm" class="shrink-0">Comunicado</span>
    </div>
    @if (item().preview) {
      <p class="text-sm text-ink-muted line-clamp-2 mt-1">{{ item().preview }}</p>
    }
    <div class="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-2">
      <span>{{ item().senderName }}</span>
      @if (item().createdAt) {
        <span>· {{ item().createdAt | date: 'short' }}</span>
      }
      @if (item().urgent) {
        <span uiBadge tone="danger" size="sm">Importante</span>
      }
      @if (!item().repliesAllowed) {
        <span uiBadge size="sm">Solo lectura</span>
      }
    </div>
  `,
})
export class BroadcastCard {
  item = input.required<BroadcastCardItem>();
}

@Component({
  selector: 'app-recent-broadcasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner, Card, CardBody, RouterLink, EmptyState, BroadcastCard, Icon],
  template: `
    <div uiCard class="border-primary/25">
      <div uiCardBody>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-ink-strong flex items-center gap-2">
            <ui-icon name="megaphone" class="text-primary" />
            Comunicados
          </h2>
          @if (inboxLink(); as link) {
            <a [routerLink]="link" class="link link-primary text-sm">Ver todos</a>
          }
        </div>
        @if (resource.isLoading() && items().length === 0) {
          <div class="flex justify-center py-8">
            <span uiSpinner></span>
          </div>
        } @else if (items().length === 0) {
          <lib-empty-state
            title="Sin comunicados recientes"
            description="Los avisos institucionales aparecerán aquí."
            icon="megaphone"
          />
        } @else {
          <div class="space-y-3 mt-1">
            @for (item of items(); track item.id) {
              @if (inboxLink(); as link) {
                <a
                  class="block rounded-lg border border-primary/20 bg-action-subtle p-3 hover:border-primary transition-colors"
                  [routerLink]="link"
                  [queryParams]="{ thread: item.id }"
                >
                  <app-broadcast-card [item]="item" />
                </a>
              } @else {
                <div class="rounded-lg border border-primary/20 bg-action-subtle p-3">
                  <app-broadcast-card [item]="item" />
                </div>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class RecentBroadcasts {
  #auth = inject(Auth);

  readonly resource = httpResource<Thread[]>(() => '/api/v1/communication/inbox/broadcasts?take=5', {
    defaultValue: [],
  });

  readonly inboxLink = computed(() => {
    if (this.#auth.isAdmin()) return '/communication';
    if (this.#auth.isTeacher()) return '/teacher/communication';
    if (this.#auth.isParent()) return '/parent/communication';
    if (this.#auth.isStudent()) return '/student/communication';
    return null;
  });

  readonly items = computed(() =>
    (this.resource.value() ?? []).map((t) => {
      const last = t.messages?.[0];
      const sender = last?.sender;
      return {
        id: t.id,
        title: t.title,
        preview: last?.body ?? '',
        senderName: sender ? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim() : '',
        createdAt: last?.createdAt ?? t.createdAt,
        urgent: t.urgencyDefault === 'IMPORTANT' || t.urgencyDefault === 'EMERGENCY',
        repliesAllowed: t.repliesAllowed !== false,
      };
    }),
  );
}
