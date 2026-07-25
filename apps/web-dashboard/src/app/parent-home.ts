import { EmptyState, PageHeader, StatCard, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toFetchQueryRecord } from './core/fetch-query-params';
import Store from './core/store';
import { LinkedChild, ParentContext } from './parent/parent-context.service';

type InboxRow = {
  id: string;
  message?: { subject?: string; createdAt?: string; sender?: { name?: string } };
};

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
  imports: [DatePipe, RouterLink, PageHeader, StatCard, EmptyState],
  template: `
    <lib-page-header title="Dashboard de padres" subtitle="Resumen del progreso de tus hijos." />

    <div class="grid gap-4 md:grid-cols-3">
      <lib-stat-card label="Hijos vinculados" [value]="children().length.toString()" helper="En tus escuelas" />
      <lib-stat-card
        label="Mensajes nuevos"
        [value]="(recentMessages.value()?.length ?? 0).toString()"
        helper="Bandeja de entrada"
      />
      <lib-stat-card
        label="Boletines recientes"
        [value]="(recentNewsletters.value()?.length ?? 0).toString()"
        helper="Publicados"
      />
    </div>

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-base-content">Hijos vinculados</h2>
          <a routerLink="/parent/portal" class="link link-primary text-sm"> Administrar </a>
        </div>
        @if (loading()) {
          <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
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

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Mensajes recientes</h2>
            <a routerLink="/messages" class="link link-primary text-sm"> Ir a mensajes </a>
          </div>
          @if ((recentMessages.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Revisa tu bandeja para novedades."
              icon="mail"
            />
          } @else {
            <div class="space-y-3">
              @for (message of recentMessages.value() ?? []; track message.id) {
                <div class="rounded-lg border border-base-200 p-3">
                  <p class="font-medium text-base-content">
                    {{ message.message?.subject }}
                  </p>
                  <div class="text-sm text-base-content/70">
                    {{ message.message?.sender?.name }} ·
                    {{ $safeNavigationMigration(message.message?.createdAt) | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      @if (!recentNewsletters.error()) {
        <div class="card border border-base-200 bg-base-100">
          <div class="card-body">
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

  public recentMessages = httpResource<InboxRow[]>(
    () => ({
      url: '/api/v1/messages',
      params: toFetchQueryRecord({ take: 4, skip: 0 }),
    }),
    { defaultValue: [] },
  );

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
