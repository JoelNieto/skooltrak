import { debounceSignal, Loader, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  Signal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { httpResource, HttpClient } from '@angular/common/http';
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
  imports: [Loader, FormsModule, DatePipe],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-start gap-4">
      <label class="input input-primary input-md">
        <span class="material-symbols-outlined">search</span>
        <input
          class="pl-0"
          type="search"
          placeholder="Buscar archivos..."
          [(ngModel)]="searchText"
        />
      </label>
        <button class="btn btn-primary" (click)="openUploadModal()">
          <span class="material-symbols-outlined">upload_file</span>
          Subir archivos
        </button>
      </div>

      @if(filesResource.isLoading()) {
      <lib-loader />
      } @if(filesResource.error()) {
      <p>Error al cargar archivos</p>
      } @if(filesResource.hasValue()) {
      <div class="overflow-x-auto bg-base-100 rounded-lg">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Acceso</th>
              <th>Actualizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for(file of filesResource.value(); track file.id) {
            <tr >
              <td class="font-medium">{{ file.name }}</td>
              <td class="text-base-200">{{ file.mimeType }}</td>
              <td class="text-base-200">{{ formatBytes(file.size ?? 0) }}</td>
              <td>
                @if(file.access) {
                <span
                  class="badge"
                  [class.badge-success]="file.access === 'EDIT'"
                  [class.badge-info]="file.access === 'VIEW'"
                >
                  {{ file.access === 'EDIT' ? 'Editar' : 'Ver' }}
                </span>
                } @else {
                <span class="text-base-200">-</span>
                }
              </td>
              <td class="text-base-200">
                {{ file.updatedAt | date : 'short' }}
              </td>
              <td class="text-right">
                @if(file.access) {
                <button
                  class="cursor-pointer hover:text-primary p-1 text-xs rounded-lg flex items-center justify-center"
                  (click)="file.id ? openFile(file.id) : null"
                >
                  <span class="material-symbols-outlined text-medium!">open_in_new</span>

                </button>
                }
              </td>
            </tr>
            } @empty {
            <tr>
              <td colspan="5" class="text-center text-base-200">
                No hay archivos para este curso.
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseFiles {
  #http = inject(HttpClient);
  #modal = inject(Modal);
  #toast = inject(Toast);
  public courseId = input.required<string>();
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;

  public filesResource = httpResource<CourseFile[]>(
    () => ({
      url: '/api/v1/files/for-course',
      params: toFetchQueryRecord({
        courseId: this.courseId(),
        take: 50,
        skip: 0,
        search: this.#debouncedSearch(),
      }),
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
