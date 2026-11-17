import {
  Badge,
  Button,
  Card,
  debounceSignal,
  Icon,
  listState,
  Modal,
  PageHeader,
  Toast,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiTab,
  UiTabContent,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import FileShareForm from './file-share-form';

type UserInfo = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  updatedAt: string;
  access?: 'VIEW' | 'EDIT' | null;
  owner: UserInfo;
  sharesCourses: Array<{ course: { id: string; name: string } }>;
  sharesUsers?: Array<{ user: UserInfo }>;
  sharesSchools?: Array<{ school: { id: string; name: string } }>;
  sharesClassGroups?: Array<{ classGroup: { id: string; name: string } }>;
};

@Component({
  selector: 'app-files',
  imports: [
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
    UiRowActions,
    Badge,
    Button,
    FormsModule,
    DatePipe,
    NgTemplateOutlet,
    PageHeader,
    UiInputGroup,
    UiTab,
    UiTabContent,
    UiTabList,
    UiTabPanel,
    UiTabs,
    Icon,
  ],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Archivos' }]"
      title="Archivos"
      subtitle="Archivos compartidos conmigo"
    />

    <ui-table-toolbar label="Buscar archivos" class="mt-4">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input
          aria-label="Buscar archivos"
          class="pl-0"
          type="search"
          placeholder="Buscar archivos..."
          [(ngModel)]="searchText"
        />
      </label>
    </ui-table-toolbar>
    <div uiTabs class="mt-4 flex flex-col gap-4">
      <div uiTabList [(selectedTab)]="tab" aria-label="Archivos">
        <button uiTab value="compartidos-conmigo">Compartidos conmigo</button>
        <button uiTab value="mis-archivos">Mis archivos</button>
      </div>
      <div uiTabPanel value="compartidos-conmigo">
        <ng-template uiTabContent>
          <div uiCard class="overflow-x-auto">
            <table uiTable [attr.aria-busy]="sharedFilesResource.isLoading()">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Propietario</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Acceso</th>
                  <th>Actualizado</th>
                  <th class="w-12"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              @switch (sharedFilesList.phase()) {
                @case ('skeleton') {
                  <tbody uiTableSkeleton [columns]="8"></tbody>
                }
                @case ('error') {
                  <tbody>
                    <tr uiTableError [columns]="8" (retry)="sharedFilesResource.reload()"></tr>
                  </tbody>
                }
                @case ('ready') {
                  <tbody>
                    @for (file of sharedFilesList.rows() ?? []; track file.id) {
                      <tr>
                        <td class="font-medium">{{ file.name }}</td>
                        <td>
                          <div class="flex items-center gap-2">
                            <div class="avatar avatar-placeholder">
                              <div class="text-white w-7 rounded-full" [style.background]="file.owner.color">
                                <span class="text-xs">{{ file.owner.initials }}</span>
                              </div>
                            </div>
                            {{ file.owner.name }}
                          </div>
                        </td>
                        <td class="text-ink-muted">{{ courseLabel(file) }}</td>
                        <td class="text-ink-muted">{{ file.mimeType }}</td>
                        <td class="text-ink-muted">{{ formatBytes(file.size) }}</td>
                        <td>
                          @if (file.access) {
                            <span uiBadge [tone]="file.access === 'EDIT' ? 'success' : 'info'">
                              {{ file.access === 'EDIT' ? 'Editar' : 'Ver' }}
                            </span>
                          } @else {
                            <span class="text-ink-muted">-</span>
                          }
                        </td>
                        <td class="text-ink-muted">
                          {{ file.updatedAt | date: 'short' }}
                        </td>
                        <td>
                          <ui-row-actions
                            [actions]="sharedActions"
                            [label]="'Acciones para ' + file.name"
                            (action)="onRowAction($event, file)"
                          />
                        </td>
                      </tr>
                    } @empty {
                      @if (searchText()) {
                        <ng-container *ngTemplateOutlet="noResults; context: { $implicit: 8 }" />
                      } @else {
                        <tr
                          uiTableEmpty
                          [columns]="8"
                          icon="folder-open"
                          title="Aún no te han compartido archivos"
                          description="Los archivos que otros compartan contigo aparecerán aquí."
                        ></tr>
                      }
                    }
                  </tbody>
                }
              }
            </table>
          </div>
        </ng-template>
      </div>
      <div uiTabPanel value="mis-archivos">
        <ng-template uiTabContent>
          <div uiCard class="overflow-x-auto">
            <table uiTable [attr.aria-busy]="ownedFilesResource.isLoading()">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Actualizado</th>
                  <th class="w-12"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              @switch (ownedFilesList.phase()) {
                @case ('skeleton') {
                  <tbody uiTableSkeleton [columns]="6"></tbody>
                }
                @case ('error') {
                  <tbody>
                    <tr uiTableError [columns]="6" (retry)="ownedFilesResource.reload()"></tr>
                  </tbody>
                }
                @case ('ready') {
                  <tbody>
                    @for (file of ownedFilesList.rows() ?? []; track file.id) {
                      <tr>
                        <td class="font-medium">{{ file.name }}</td>
                        <td class="text-ink-muted">{{ courseLabel(file) }}</td>
                        <td class="text-ink-muted">{{ file.mimeType }}</td>
                        <td class="text-ink-muted">{{ formatBytes(file.size) }}</td>
                        <td class="text-ink-muted">
                          {{ file.updatedAt | date: 'short' }}
                        </td>
                        <td>
                          <ui-row-actions
                            [actions]="ownedActions"
                            [label]="'Acciones para ' + file.name"
                            (action)="onRowAction($event, file)"
                          />
                        </td>
                      </tr>
                    } @empty {
                      @if (searchText()) {
                        <ng-container *ngTemplateOutlet="noResults; context: { $implicit: 6 }" />
                      } @else {
                        <tr uiTableEmpty [columns]="6" icon="folder" title="Aún no has subido archivos"></tr>
                      }
                    }
                  </tbody>
                }
              }
            </table>
          </div>
        </ng-template>
      </div>
    </div>
    <ng-template #noResults let-columns>
      <tr
        uiTableEmpty
        [columns]="columns"
        icon="search-x"
        title="Sin resultados"
        description="Ningún archivo coincide con la búsqueda."
      >
        <button uiButton variant="ghost" size="sm" (click)="searchText.set('')">Limpiar búsqueda</button>
      </tr>
    </ng-template>
  `,
})
export default class FilesPage {
  /** Selected section; the tab list and panels follow it. */
  readonly tab = signal('compartidos-conmigo');
  #http = inject(HttpClient);
  #toast = inject(Toast);
  #modal = inject(Modal);
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;

  public sharedFilesResource = httpResource<FileItem[]>(
    () => ({
      url: '/api/v1/files/shared-with-me',
      params: toFetchQueryRecord({ search: this.#debouncedSearch() }),
    }),
    { defaultValue: [] },
  );

  public ownedFilesResource = httpResource<FileItem[]>(
    () => ({
      url: '/api/v1/files/owned',
      params: toFetchQueryRecord({ search: this.#debouncedSearch() }),
    }),
    { defaultValue: [] },
  );

  /** Both lists with smooth loading: rows stay while a search or reload is in flight. */
  protected readonly sharedFilesList = listState(this.sharedFilesResource);
  protected readonly ownedFilesList = listState(this.ownedFilesResource);

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly sharedActions: UiRowAction[] = [
    { id: 'open', label: 'Abrir', icon: 'external-link' },
    { id: 'download', label: 'Descargar', icon: 'download' },
  ];
  protected readonly ownedActions: UiRowAction[] = [
    ...this.sharedActions,
    { id: 'share', label: 'Compartir', icon: 'share-2' },
  ];

  protected onRowAction(action: string, file: FileItem): void {
    switch (action) {
      case 'open':
        this.openFile(file.id);
        break;
      case 'download':
        this.downloadFile(file.id);
        break;
      case 'share':
        this.openShareModal(file);
        break;
    }
  }

  constructor() {
    this.#debouncedSearch = debounceSignal(this.searchText, 400);
  }

  openFile(fileId: string) {
    this.#http.post<{ downloadUrl: string }>('/api/v1/files/download-url', { fileId }).subscribe({
      next: (result) => {
        const url = result?.downloadUrl;
        if (url) {
          window.open(url, '_blank');
        }
      },
      error: () => {
        this.#toast.showError('Error al abrir el archivo');
      },
    });
  }

  downloadFile(fileId: string) {
    this.#http.post<{ downloadUrl: string }>('/api/v1/files/download-url', { fileId }).subscribe({
      next: (result) => {
        const url = result?.downloadUrl;
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = '';
          link.click();
        }
      },
      error: () => {
        this.#toast.showError('Error al descargar el archivo');
      },
    });
  }

  openShareModal(file: FileItem) {
    const shareTargets = {
      COURSE: {
        ids: file.sharesCourses?.map((share) => share.course.id) ?? [],
        labels: Object.fromEntries((file.sharesCourses ?? []).map((share) => [share.course.id, share.course.name])),
      },
      CLASS_GROUP: {
        ids: file.sharesClassGroups?.map((share) => share.classGroup.id) ?? [],
        labels: Object.fromEntries(
          (file.sharesClassGroups ?? []).map((share) => [share.classGroup.id, share.classGroup.name]),
        ),
      },
      SCHOOL: {
        ids: file.sharesSchools?.map((share) => share.school.id) ?? [],
        labels: Object.fromEntries((file.sharesSchools ?? []).map((share) => [share.school.id, share.school.name])),
      },
      USER: {
        ids: file.sharesUsers?.map((share) => share.user.id) ?? [],
        labels: Object.fromEntries((file.sharesUsers ?? []).map((share) => [share.user.id, share.user.name])),
      },
    };

    this.#modal
      .open(FileShareForm, {
        title: 'Compartir archivo',
        size: 'medium',
        data: { fileId: file.id, shareTargets },
      })
      .closed.subscribe((result) => {
        const typedResult = result as { shared?: boolean } | undefined;
        if (typedResult?.shared) {
          this.sharedFilesResource.reload();
          this.ownedFilesResource.reload();
        }
      });
  }

  courseLabel(file: FileItem) {
    if (!file.sharesCourses?.length) {
      return '-';
    }
    const names = file.sharesCourses.map((share) => share.course.name);
    return names.join(', ');
  }

  formatBytes(bytes: number) {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }
}
