import { Confirmation, Pagination, Paginator, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, forkJoin, map, switchMap, tap } from 'rxjs';
import Store from '../../core/store';
import { toFetchQueryParams } from '../../core/fetch-query-params';

type NewsletterItem = {
  id: string;
  title: string;
  published: boolean;
  publishedAt: string | null;
  school: { id: string; name: string };
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

@Component({
  selector: 'app-newsletters',
  imports: [DatePipe, Paginator, FormsModule, RouterLink, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  providers: [Pagination],
  template: `
    @if (newsletters.error()) {
      <div role="alert" class="alert alert-error">
        <span class="material-symbols-outlined">error</span>
        <span>Error al cargar los boletines. Verifica tus permisos o intenta de nuevo.</span>
        <button class="btn btn-sm btn-ghost" (click)="newsletters.reload()">Reintentar</button>
      </div>
    } @else {
      <div class="flex flex-col gap-4 md:flex-row md:justify-between">
        <div class="md:w-96 w-full">
          <label class="input input-primary">
            <span class="material-symbols-outlined">search</span>
            <input class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
          </label>
        </div>
        <a routerLink="/admin/newsletters/new" class="btn btn-primary">
          <span class="material-symbols-outlined">add_circle</span> Nuevo boletín
        </a>
      </div>
      <div class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300">
        <table class="table">
          <thead>
            <tr>
              <th
                class="cursor-pointer hover:bg-base-200"
                [class]="pagination.sortBy() === 'title' ? 'bg-primary/10 text-primary! hover:bg-primary/20' : ''"
                (click)="pagination.setOrder('title')"
              >
                <div class="flex items-center gap-2">
                  Título
                  @if (pagination.sortBy() === 'title') {
                    <span class="material-symbols-outlined text-xl">
                      {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                  }
                </div>
              </th>
              <th>Colegio</th>
              <th>Estado</th>
              <th
                class="cursor-pointer hover:bg-base-200"
                [class]="pagination.sortBy() === 'publishedAt' ? 'bg-primary/10 text-primary! hover:bg-primary/20' : ''"
                (click)="pagination.setOrder('publishedAt')"
              >
                <div class="flex items-center gap-2">
                  Publicado
                  @if (pagination.sortBy() === 'publishedAt') {
                    <span class="material-symbols-outlined text-xl">
                      {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                  }
                </div>
              </th>
              <th>Autor</th>
              <th
                class="cursor-pointer hover:bg-base-200"
                [class]="pagination.sortBy() === 'createdAt' ? 'bg-primary/10 text-primary! hover:bg-primary/20' : ''"
                (click)="pagination.setOrder('createdAt')"
              >
                <div class="flex items-center gap-2">
                  Creado
                  @if (pagination.sortBy() === 'createdAt') {
                    <span class="material-symbols-outlined text-xl">
                      {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                  }
                </div>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (newsletter of newsletters.value() ?? []; track newsletter.id) {
              <tr>
                <td>{{ newsletter.title }}</td>
                <td>{{ newsletter.school.name }}</td>
                <td>
                  @if (newsletter.published) {
                    <span class="badge badge-success badge-sm">Publicado</span>
                  } @else {
                    <span class="badge badge-neutral badge-sm">Borrador</span>
                  }
                </td>
                <td>{{ newsletter.publishedAt ? (newsletter.publishedAt | date: 'short') : '-' }}</td>
                <td>{{ newsletter.author.name }}</td>
                <td>{{ newsletter.createdAt | date: 'short' }}</td>
                <td>
                  <button
                    class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                    ngMenuTrigger
                    #origin
                    #trigger="ngMenuTrigger"
                    [menu]="actionsMenu()"
                  >
                    <span class="material-symbols-outlined text-xl">more_horiz</span>
                  </button>
                  <ng-template
                    [cdkConnectedOverlayOpen]="trigger.expanded()"
                    [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
                    [cdkConnectedOverlayPositions]="[
                      {
                        originX: 'end',
                        originY: 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                        offsetY: 4,
                      },
                    ]"
                    cdkAttachPopoverAsChild
                  >
                    <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                      <ng-template ngMenuContent>
                        <a
                          ngMenuItem
                          value="Edit"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          [routerLink]="['/admin/newsletters', newsletter.id, 'edit']"
                        >
                          <span class="material-symbols-outlined text-lg">edit</span>
                          <span>Editar</span>
                        </a>
                        <button
                          ngMenuItem
                          [value]="newsletter.published ? 'Unpublish' : 'Publish'"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="togglePublish(newsletter)"
                        >
                          <span class="material-symbols-outlined text-lg">
                            {{ newsletter.published ? 'unpublished' : 'publish' }}
                          </span>
                          <span>{{ newsletter.published ? 'Despublicar' : 'Publicar' }}</span>
                        </button>
                        <button
                          ngMenuItem
                          value="Delete"
                          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                          (click)="deleteNewsletter(newsletter)"
                        >
                          <span class="material-symbols-outlined text-lg">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </ng-template>
                    </div>
                  </ng-template>
                </td>
              </tr>
            } @empty {
              @if (newsletters.isLoading()) {
                @for (row of [1, 2, 3, 4, 5]; track row) {
                  <tr>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                    <td><div class="skeleton h-4 w-full"></div></td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="7" class="text-center">Sin boletines para este filtro</td>
                </tr>
              }
            }
          </tbody>
        </table>
        <div class="p-4 rounded-b-lg">
          <lib-paginator
            [count]="pagination.count()"
            [take]="pagination.take()"
            [skip]="pagination.skip()"
            (skipChange)="pagination.updateSkip($event)"
            (takeChange)="pagination.updateTake($event)"
          />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Newsletters {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  #store = inject(Store);
  pagination = inject(Pagination);
  searchText = signal('');
  actionsMenu = viewChild<Menu<string>>('actionsMenu');

  private enrichAuthorName(n: {
    author?: {
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      id: string;
    };
    school: { id: string; name: string };
  } & Omit<NewsletterItem, 'author'>): NewsletterItem {
    const a = n.author;
    const name =
      a?.name?.trim() ||
      [a?.firstName, a?.lastName].filter(Boolean).join(' ').trim() ||
      '—';
    return {
      ...n,
      author: { id: a?.id ?? '', name },
    };
  }

  public newsletters = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
      schoolId: this.#store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { take, skip, search, orderBy, orderDirection, schoolId } = params;
      const q = toFetchQueryParams({
        take,
        skip,
        search: search ?? undefined,
        orderBy: orderBy == null ? undefined : orderBy,
        orderDirection: orderDirection == null ? undefined : orderDirection,
        schoolId: schoolId == null ? undefined : schoolId,
      });
      return forkJoin({
        count: this.#http.get<number>('/api/v1/newsletters/count', { params: q }),
        list: this.#http.get<
          Array<{
            id: string;
            title: string;
            published: boolean;
            publishedAt: string | null;
            school: { id: string; name: string };
            author: { id: string; name?: string | null; firstName?: string | null; lastName?: string | null };
            createdAt: string;
            updatedAt: string;
          }>
        >('/api/v1/newsletters', { params: q }),
      }).pipe(
        tap(({ count }) => this.pagination.updateCount(count ?? 0)),
        map(({ list }) => (list ?? []).map((row) => this.enrichAuthorName(row))),
      );
    },
  });

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
  }

  public togglePublish(newsletter: NewsletterItem) {
    this.#http
      .patch('/api/v1/newsletters', {
        id: newsletter.id,
        published: !newsletter.published,
      })
      .subscribe({
        next: () => {
          this.newsletters.reload();
          this.#toast.showSuccess(newsletter.published ? 'Boletín despublicado' : 'Boletín publicado');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al actualizar el boletín');
        },
      });
  }

  public deleteNewsletter(newsletter: NewsletterItem) {
    this.#confirmation
      .confirm({
        title: 'Eliminar boletín',
        message: `¿Estás seguro de eliminar el boletín "${newsletter.title}"?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.#http.delete(`/api/v1/newsletters/${newsletter.id}`)),
      )
      .subscribe({
        next: () => {
          this.newsletters.reload();
          this.#toast.showSuccess('Boletín eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar el boletín');
        },
      });
  }
}
