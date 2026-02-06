import { debounceSignal, Loader, Modal, PageHeader, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Signal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
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
  imports: [Loader, FormsModule, RouterLink, DatePipe, PageHeader],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Archivos</li>
      </ul>
    </div>
    <lib-page-header title="Archivos" subtitle="Archivos compartidos conmigo" />

    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
      <label class="input input-primary input-md mt-3 md:mt-0">
        <span class="material-symbols-outlined">search</span>
        <input class="pl-0" type="search" placeholder="Buscar archivos..." [(ngModel)]="searchText" />
      </label>
    </div>
    <div class="tabs tabs-box mt-4">
      <input class="tab" type="radio" name="files_tabs" aria-label="Compartidos conmigo" checked="checked" />
      <div class="tab-content bg-base-100 border-base-300 p-4">
        @if (sharedFilesResource.isLoading()) {
          <lib-loader />
        }
        @if (sharedFilesResource.error()) {
          <p>Error al cargar archivos compartidos</p>
        }
        @if (sharedFilesResource.hasValue()) {
          <div class="overflow-x-auto bg-base-100 rounded-lg">
            <table class="table">
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
                  <tr class="hover:bg-base-300">
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
                    <td class="text-base-200">{{ courseLabel(file) }}</td>
                    <td class="text-base-200">{{ file.mimeType }}</td>
                    <td class="text-base-200">{{ formatBytes(file.size) }}</td>
                    <td>
                      @if (file.access) {
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
                      {{ file.updatedAt | date: 'short' }}
                    </td>
                    <td class="text-right">
                      <button class="btn btn-primary btn-xs" (click)="openFile(file.id)">Abrir</button>
                      <button class="btn btn-ghost btn-xs" (click)="downloadFile(file.id)">Descargar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center text-base-200">No hay archivos compartidos.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      <input class="tab" type="radio" name="files_tabs" aria-label="Mis archivos" />
      <div class="tab-content bg-base-100 border-base-300 p-4">
        @if (ownedFilesResource.isLoading()) {
          <lib-loader />
        }
        @if (ownedFilesResource.error()) {
          <p>Error al cargar mis archivos</p>
        }
        @if (ownedFilesResource.hasValue()) {
          <div class="overflow-x-auto bg-base-100 rounded-lg">
            <table class="table">
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
                    <td class="text-base-200">{{ courseLabel(file) }}</td>
                    <td class="text-base-200">{{ file.mimeType }}</td>
                    <td class="text-base-200">{{ formatBytes(file.size) }}</td>
                    <td class="text-base-200">
                      {{ file.updatedAt | date: 'short' }}
                    </td>
                    <td class="text-right">
                      <button
                        class="text-base-content hover:text-success p-1 rounded-lg  cursor-pointer"
                        (click)="openFile(file.id)"
                      >
                        <span class="material-symbols-outlined text-medium!">open_in_new</span>
                      </button>
                      <button
                        class="text-base-content hover:text-blue-500 p-1 rounded-lg  cursor-pointer"
                        (click)="downloadFile(file.id)"
                      >
                        <span class="material-symbols-outlined text-medium!">download</span>
                      </button>
                      <button
                        class="text-base-content hover:text-primary p-1 rounded-lg cursor-pointer"
                        (click)="openShareModal(file)"
                      >
                        <span class="material-symbols-outlined text-medium!">share</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center text-base-200">No has subido archivos.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilesPage {
  #apollo = inject(Apollo);
  #toast = inject(Toast);
  #modal = inject(Modal);
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;

  public sharedFilesResource = rxResource({
    params: () => ({
      search: this.#debouncedSearch(),
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{ filesSharedWithMe: FileItem[] }>({
          query: gql`
            query FilesSharedWithMe($search: String) {
              filesSharedWithMe(search: $search) {
                id
                name
                mimeType
                size
                access
                updatedAt
                sharesCourses {
                  course {
                    id
                    name
                  }
                }
                sharesUsers {
                  user {
                    id
                    name
                    initials
                    color
                  }
                }
                sharesSchools {
                  school {
                    id
                    name
                  }
                }
                sharesClassGroups {
                  classGroup {
                    id
                    name
                  }
                }
                owner {
                  id
                  name
                  initials
                  color
                }
              }
            }
          `,
          variables: {
            search: params.search,
          },
        })
        .valueChanges.pipe(map((result) => result.data.filesSharedWithMe));
    },
  });

  public ownedFilesResource = rxResource({
    params: () => ({
      search: this.#debouncedSearch(),
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{ filesOwned: FileItem[] }>({
          query: gql`
            query FilesOwned($search: String) {
              filesOwned(search: $search) {
                id
                name
                mimeType
                size
                access
                updatedAt
                sharesCourses {
                  course {
                    id
                    name
                  }
                }
                owner {
                  id
                  name
                  initials
                  color
                }
              }
            }
          `,
          variables: {
            search: params.search,
          },
        })
        .valueChanges.pipe(map((result) => result.data.filesOwned));
    },
  });

  constructor() {
    this.#debouncedSearch = debounceSignal(this.searchText, 400);
  }

  openFile(fileId: string) {
    this.#apollo
      .mutate<{ createFileDownloadUrl: { downloadUrl: string } }>({
        mutation: gql`
          mutation CreateFileDownloadUrl($createFileDownloadInput: CreateFileDownloadInput!) {
            createFileDownloadUrl(createFileDownloadInput: $createFileDownloadInput) {
              downloadUrl
            }
          }
        `,
        variables: {
          createFileDownloadInput: { fileId },
        },
      })
      .subscribe({
        next: (result) => {
          const url = result.data?.createFileDownloadUrl.downloadUrl;
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
    this.#apollo
      .mutate<{ createFileDownloadUrl: { downloadUrl: string } }>({
        mutation: gql`
          mutation CreateFileDownloadUrl($createFileDownloadInput: CreateFileDownloadInput!) {
            createFileDownloadUrl(createFileDownloadInput: $createFileDownloadInput) {
              downloadUrl
            }
          }
        `,
        variables: {
          createFileDownloadInput: { fileId },
        },
      })
      .subscribe({
        next: (result) => {
          const url = result.data?.createFileDownloadUrl.downloadUrl;
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
