import {
  Badge,
  Button,
  Card,
  debounceSignal,
  Icon,
  listState,
  Modal,
  Toast,
  UiInputGroup,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import CourseFileUploadForm from './course-file-upload-form';

type CourseFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  updatedAt: string;
  access?: 'VIEW' | 'EDIT' | null;
};

@Component({
  selector: 'app-course-files',
  imports: [
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
    Badge,
    Button,
    FormsModule,
    DatePipe,
    UiInputGroup,
    Icon,
  ],
  template: `
    <ui-table-toolbar>
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
      @if (!readOnly()) {
        <button uiToolbarEnd uiButton variant="primary" size="sm" (click)="openUploadModal()">
          <ui-icon name="file-up" class="text-base" />
          Subir archivos
        </button>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="filesResource.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Tamaño</th>
            <th>Acceso</th>
            <th>Actualizado</th>
            <th class="w-12"><span class="sr-only">Abrir</span></th>
          </tr>
        </thead>
        @switch (filesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="filesResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (file of filesList.rows() ?? []; track file.id) {
                <tr>
                  <td class="font-medium">{{ file.name }}</td>
                  <td class="text-ink-muted">{{ file.mimeType }}</td>
                  <td class="text-ink-muted">{{ formatBytes(file.size ?? 0) }}</td>
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
                    @if (file.access) {
                      <button
                        uiButton
                        variant="ghost"
                        size="sm"
                        iconOnly
                        type="button"
                        [attr.aria-label]="'Abrir ' + file.name"
                        (click)="openFile(file.id)"
                      >
                        <ui-icon name="external-link" class="text-base" />
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                @if (searchText()) {
                  <tr
                    uiTableEmpty
                    [columns]="6"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún archivo coincide con la búsqueda."
                  >
                    <button uiButton variant="ghost" size="sm" (click)="searchText.set('')">Limpiar búsqueda</button>
                  </tr>
                } @else {
                  <tr uiTableEmpty [columns]="6" icon="folder-open" title="Aún no hay archivos en este curso">
                    @if (!readOnly()) {
                      <button uiButton size="sm" (click)="openUploadModal()">Subir archivos</button>
                    }
                  </tr>
                }
              }
            </tbody>
          }
        }
      </table>
    </div>
  `,
})
export default class CourseFiles {
  #http = inject(HttpClient);
  #modal = inject(Modal);
  #toast = inject(Toast);
  public courseId = input.required<string>();
  /** A homeroom teacher's read-only view (BR-ACA-001.16): no uploads. */
  public readOnly = input(false);
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;

  public filesResource = httpResource<CourseFile[]>(
    () => ({
      url: '/api/v1/files/for-course',
      params: toFetchQueryRecord({
        courseId: this.courseId(),
        pageSize: 50,
        page: 1,
        search: this.#debouncedSearch(),
      }),
    }),
    { defaultValue: [] },
  );

  /** files with smooth loading: rows stay while a search or reload is in flight. */
  protected readonly filesList = listState(this.filesResource);

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

  openUploadModal() {
    this.#modal
      .open(CourseFileUploadForm, {
        title: 'Subir archivo',
        size: 'small',
        data: { courseId: this.courseId() },
      })
      .closed.subscribe((result) => {
        const typedResult = result as { created?: boolean } | undefined;
        if (typedResult?.created) {
          this.filesResource.reload();
        }
      });
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
