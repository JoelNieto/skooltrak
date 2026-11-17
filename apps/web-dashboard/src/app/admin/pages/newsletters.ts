import {
  Badge,
  Button,
  Card,
  Confirmation,
  Icon,
  Pagination,
  Paginator,
  Toast,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiSortHeader,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, forkJoin, map, switchMap, tap } from 'rxjs';
import { toFetchQueryParams } from '../../core/fetch-query-params';
import Store from '../../core/store';

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
  imports: [
    UiTableToolbar,
    UiSortHeader,
    Card,
    UiTable,
    Badge,
    Button,
    DatePipe,
    Paginator,
    FormsModule,
    RouterLink,
    UiInputGroup,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],
  providers: [Pagination],
  template: `
    <ui-table-toolbar>
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input aria-label="Buscar" class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
      </label>
      <a uiToolbarEnd uiButton variant="primary" size="sm" routerLink="/admin/newsletters/new">
        <ui-icon name="circle-plus" class="text-base" /> Nuevo boletín
      </a>
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table
        uiTable
        [sort]="pagination.sort()"
        (sortChange)="pagination.setSort($event)"
        [attr.aria-busy]="newsletters.isLoading()"
      >
        <thead>
          <tr>
            <th uiSortHeader="title">Título</th>
            <th>Colegio</th>
            <th>Estado</th>
            <th uiSortHeader="publishedAt">Publicado</th>
            <th>Autor</th>
            <th uiSortHeader="createdAt">Creado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (newslettersList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pagination.take()" [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr
                uiTableError
                [columns]="7"
                description="Verifica tus permisos o intenta de nuevo."
                (retry)="newsletters.reload()"
              ></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (newsletter of newslettersList.rows() ?? []; track newsletter.id) {
                <tr>
                  <td>{{ newsletter.title }}</td>
                  <td>{{ newsletter.school.name }}</td>
                  <td>
                    @if (newsletter.published) {
                      <span uiBadge tone="success" size="sm">Publicado</span>
                    } @else {
                      <span uiBadge size="sm">Borrador</span>
                    }
                  </td>
                  <td>{{ newsletter.publishedAt ? (newsletter.publishedAt | date: 'short') : '-' }}</td>
                  <td>{{ newsletter.author.name }}</td>
                  <td>{{ newsletter.createdAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions(newsletter)"
                      [label]="'Acciones para ' + newsletter.title"
                      (action)="onRowAction($event, newsletter)"
                    />
                  </td>
                </tr>
              } @empty {
                @if (searchText()) {
                  <tr
                    uiTableEmpty
                    [columns]="7"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún resultado coincide con la búsqueda."
                  ></tr>
                } @else {
                  <tr uiTableEmpty [columns]="7" icon="newspaper" title="Aún no hay boletines"></tr>
                }
              }
            </tbody>
          }
        }
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
  `,
})
export default class Newsletters {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  #store = inject(Store);
  pagination = inject(Pagination);
  searchText = signal('');

  private enrichAuthorName(
    n: {
      author?: {
        name?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        id: string;
      };
      school: { id: string; name: string };
    } & Omit<NewsletterItem, 'author'>,
  ): NewsletterItem {
    const a = n.author;
    const name = a?.name?.trim() || [a?.firstName, a?.lastName].filter(Boolean).join(' ').trim() || '—';
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
  /** newsletters with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly newslettersList = listState(this.newsletters);

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

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(newsletter: NewsletterItem): UiRowAction[] {
    return [
      { id: 'edit', label: 'Editar', icon: 'pencil', link: ['/admin/newsletters', newsletter.id, 'edit'] },
      { id: 'togglepublish', label: newsletter.published ? 'Despublicar' : 'Publicar' },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, newsletter: NewsletterItem): void {
    switch (action) {
      case 'togglepublish':
        this.togglePublish(newsletter);
        break;
      case 'delete':
        this.deleteNewsletter(newsletter);
        break;
    }
  }
}
