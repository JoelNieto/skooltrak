import {
  Badge,
  Button,
  Card,
  debounceSignal,
  EmptyState,
  Loader,
  Modal,
  PageHeader,
  Toast,
  UiInputGroup,
  UiTable,
} from '#/ui';
import { DatePipe } from '@angular/common';
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
  imports: [Card, UiTable, Badge, Button, Loader, FormsModule, DatePipe, PageHeader, EmptyState, UiInputGroup],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Archivos' }]"
      title="Archivos"
      subtitle="Archivos compartidos conmigo"
    />

    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
      <label uiInputGroup class="mt-3 md:mt-0">
        <span class="material-symbols-outlined">search</span>
        <input class="pl-0" type="search" placeholder="Buscar archivos..." [(ngModel)]="searchText" />
      </label>
    </div>
    <div class="tabs tabs-box mt-4">
      <input class="tab" type="radio" name="files_tabs" aria-label="Compartidos conmigo" checked="checked" />
      <div class="tab-content bg-surface-1 border-line p-4">
        @if (sharedFilesResource.isLoading()) {
          <lib-loader />
        }
        @if (sharedFilesResource.error()) {
          <p>Error al cargar archivos compartidos</p>
        }
        @if (sharedFilesResource.hasValue()) {
          <div uiCard class="overflow-x-auto">
            <table uiTable>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Propietario</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Acceso</th>
                  <th></th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (file of sharedFilesResource.value(); track file.id) {
                  <tr class="hover:bg-surface-2">
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
                    <td class="text-right">
                      @if (file.id) {
                        <button uiButton variant="primary" size="sm" (click)="openFile(file.id)">Abrir</button>
                        <button uiButton variant="ghost" size="sm" (click)="downloadFile(file.id)">Descargar</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center text-ink-muted">
                      <lib-empty-state
                        title="No hay archivos compartidos"
                        icon="folder_open"
                        description="No has compartido ningún archivo aún."
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      <input class="tab" type="radio" name="files_tabs" aria-label="Mis archivos" />
      <div class="tab-content bg-surface-1 border-line p-4">
        @if (ownedFilesResource.isLoading()) {
          <lib-loader />
        }
        @if (ownedFilesResource.error()) {
          <p>Error al cargar mis archivos</p>
        }
        @if (ownedFilesResource.hasValue()) {
          <div uiCard class="overflow-x-auto">
            <table uiTable>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Actualizado</th>
                  <th class="text-right"></th>
                </tr>
              </thead>
              <tbody>
                @for (file of ownedFilesResource.value(); track file.id) {
                  <tr>
                    <td class="font-medium">{{ file.name }}</td>
                    <td class="text-ink-muted">{{ courseLabel(file) }}</td>
                    <td class="text-ink-muted">{{ file.mimeType }}</td>
                    <td class="text-ink-muted">{{ formatBytes(file.size) }}</td>
                    <td class="text-ink-muted">
                      {{ file.updatedAt | date: 'short' }}
                    </td>
                    <td class="text-right">
                      @if (file.id) {
                        <button
                          class="text-ink-strong hover:text-success p-1 rounded-lg  cursor-pointer"
                          (click)="openFile(file.id)"
                        >
                          <span class="material-symbols-outlined text-medium!">open_in_new</span>
                        </button>
                        <button
                          class="text-ink-strong hover:text-action p-1 rounded-lg  cursor-pointer"
                          (click)="downloadFile(file.id)"
                        >
                          <span class="material-symbols-outlined text-medium!">download</span>
                        </button>
                        <button
                          class="text-ink-strong hover:text-primary p-1 rounded-lg cursor-pointer"
                          (click)="openShareModal(file)"
                        >
                          <span class="material-symbols-outlined text-medium!">share</span>
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center text-ink-muted">No has subido archivos.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export default class FilesPage {
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
