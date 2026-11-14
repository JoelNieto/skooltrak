import { Card, CardBody, EmptyState, PageHeader, Spinner, StatCard, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Auth from './auth/auth';
import Store from './core/store';
import { Thread } from './communication/communication-api.service';
import { LinkedChild, ParentContext } from './parent/parent-context.service';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: { name: string };
};

type ParentMeResponse = {
  id: string;
  organizationId: string;
  students: Array<{
    id: string;
    firstName: string;
    fatherName: string;
    school: { id: string; name: string } | null;
    classGroup: { id: string; name: string } | null;
  }>;
};

@Component({
  selector: 'app-parent-home',
  imports: [Spinner, Card, CardBody, DatePipe, RouterLink, PageHeader, StatCard, EmptyState, RecentBroadcasts],
  template: `
    <lib-page-header title="Dashboard de padres" subtitle="Resumen del progreso de tus hijos." />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Hijos vinculados" [value]="children().length.toString()" helper="En tus escuelas" />
      <lib-stat-card label="Mensajes nuevos" [value]="unreadCount().toString()" helper="Bandeja de entrada" />
      <lib-stat-card
        label="Boletines recientes"
        [value]="(recentNewsletters.value()?.length ?? 0).toString()"
        helper="Publicados"
      />
    </div>

    <div uiCard class="mt-6">
      <div uiCardBody>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-base-content">Hijos vinculados</h2>
          <a routerLink="/parent/portal" class="link link-primary text-sm"> Administrar </a>
        </div>
        @if (loading()) {
          <div class="flex justify-center py-8">
            <span uiSpinner></span>
          </div>
        } @else if (children().length === 0) {
          <lib-empty-state
            title="Sin hijos vinculados"
            description="Vincula a tus hijos con su código de matrícula para ver su progreso."
            icon="group"
          />
        } @else {
          <div class="grid gap-4 md:grid-cols-2 mt-2">
            @for (child of children(); track child.studentId) {
              <button
                class="text-left border border-base-200 rounded-lg p-4 hover:border-primary transition-colors"
                (click)="openChild(child)"
              >
                <p class="font-semibold text-base-content">{{ child.name }}</p>
                <p class="text-sm text-base-content/70">{{ child.schoolName }}</p>
                @if (child.classGroupName) {
                  <p class="text-sm text-base-content/70">Grupo: {{ child.classGroupName }}</p>
                }
              </button>
            }
          </div>
        }
      </div>
    </div>

    <div class="mt-6">
      <app-recent-broadcasts />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div uiCard>
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Mensajes recientes</h2>
            <a routerLink="/parent/communication" class="link link-primary text-sm"> Ir a mensajes </a>
          </div>
          @if ((recentThreads().length ?? 0) === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Cuando un docente te escriba, el mensaje aparecerá aquí."
              icon="mail"
            />
          } @else {
            <div class="space-y-3">
              @for (thread of recentThreads(); track thread.id) {
                <a
                  routerLink="/parent/communication"
                  class="block rounded-lg border border-base-200 p-3 hover:border-primary transition-colors"
                >
                  <p class="font-medium text-base-content">
                    {{ thread.title }}
                  </p>
                  <p class="text-sm text-base-content/70 line-clamp-2">{{ thread.preview }}</p>
                  <div class="text-sm text-base-content/70 mt-1">
                    {{ thread.senderName }}
                    @if (thread.createdAt) {
                      · {{ thread.createdAt | date: 'short' }}
                    }
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </div>

      @if (!recentNewsletters.error()) {
        <div uiCard>
          <div uiCardBody>
            <h2 class="text-lg font-semibold text-base-content">Boletines recientes</h2>
            @if ((recentNewsletters.value() ?? []).length === 0) {
              <lib-empty-state
                title="Sin boletines recientes"
                description="Los boletines publicados aparecerán aquí."
                icon="newspaper"
              />
            } @else {
              <div class="space-y-3">
                @for (newsletter of recentNewsletters.value() ?? []; track newsletter.id) {
                  <div class="rounded-lg border border-base-200 p-3">
                    <p class="font-medium text-base-content">{{ newsletter.title }}</p>
                    <p class="text-sm text-base-content/70 mt-1 line-clamp-2">
                      {{ stripHtml(newsletter.content) }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-sm text-base-content/70">
                        {{ newsletter.author.name }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-sm"> Ver más </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export default class ParentHome {
  #store = inject(Store);
  #ctx = inject(ParentContext);
  #router = inject(Router);
  #toasts = inject(Toast);
  #auth = inject(Auth);

  public loading = signal(true);

  #parentsResource = httpResource<ParentMeResponse[]>(() => ({
    url: '/api/v1/parents/me',
  }));

  public children = computed<LinkedChild[]>(() => {
    const parents = this.#parentsResource.value() ?? [];
    const list: LinkedChild[] = [];
    for (const p of parents) {
      for (const s of p.students ?? []) {
        list.push({
          studentId: s.id,
          name: `${s.firstName} ${s.fatherName}`,
          schoolId: s.school?.id ?? '',
          schoolName: s.school?.name ?? 'Escuela',
          organizationId: p.organizationId,
          classGroupName: s.classGroup?.name ?? null,
        });
      }
    }
    return list;
  });

  constructor() {
    effect(() => {
      if (this.#parentsResource.hasValue()) {
        this.loading.set(false);
      } else if (this.#parentsResource.error()) {
        this.loading.set(false);
        this.#toasts.showError('No se pudieron cargar tus hijos');
      }
    });
  }

  public recentMessages = httpResource<Thread[]>(() => '/api/v1/communication/threads', { defaultValue: [] });

  public recentThreads = computed(() => {
    return [...(this.recentMessages.value() ?? [])]
      .filter((t) => !t.broadcast)
      .sort((a, b) => {
        const aDate = a.messages?.[0]?.createdAt ?? a.updatedAt;
        const bDate = b.messages?.[0]?.createdAt ?? b.updatedAt;
        return aDate < bDate ? 1 : -1;
      })
      .slice(0, 4)
      .map((t) => {
        const last = t.messages?.[0];
        const sender = last?.sender;
        return {
          id: t.id,
          title: t.title,
          preview: last?.body ?? '',
          senderName: sender ? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim() : '',
          createdAt: last?.createdAt,
        };
      });
  });

  public unreadCount = computed(() => {
    const me = this.#auth.meId();
    return (this.recentMessages.value() ?? []).filter((t) => {
      const last = t.messages?.[0];
      if (!last || last.senderId === me) return false;
      const mine = t.participants.find((p) => p.userId === me);
      if (!mine?.lastReadAt) return true;
      return new Date(last.createdAt) > new Date(mine.lastReadAt);
    }).length;
  });

  public recentNewsletters = httpResource<PublishedNewsletter[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/newsletters/published',
        params: { schoolId, take: '3' },
      };
    },
    { defaultValue: [] },
  );

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }

  openChild(child: LinkedChild) {
    this.#ctx.select(child);
    this.#router.navigate(['/parent/progress']);
  }
}
