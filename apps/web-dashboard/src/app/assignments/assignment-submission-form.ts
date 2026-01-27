import { Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { from, map, switchMap } from 'rxjs';
import AssignmentDropzone, { UploadedFile } from './assignment-dropzone';

type AssignmentSubmission = Prisma.AssignmentSubmissionGetPayload<{
  include: { file: true };
}>;

@Component({
  selector: 'app-assignment-submission-form',
  imports: [AssignmentDropzone, DatePipe],
  template: `
    <div class="space-y-4">
      @if (submissionResource.isLoading()) {
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (submissionResource.hasValue() && submissionResource.value()) {
        @let submission = submissionResource.value()!;
        <div class="alert alert-success">
          <span class="material-symbols-outlined">check_circle</span>
          <div>
            <h3 class="font-bold">Entrega completada</h3>
            <p class="text-sm">
              Entregaste el {{ submission.submittedAt | date: 'medium' }}
            </p>
          </div>
        </div>
        <div class="flex items-center justify-between p-4 bg-base-200 rounded-lg">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-2xl">
              {{ getFileIcon(submission.file.mimeType) }}
            </span>
            <div>
              <p class="font-medium">{{ submission.file.name }}</p>
              <p class="text-sm text-base-content/50">
                {{ formatBytes(submission.file.size) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-ghost btn-sm"
              (click)="downloadFile(submission.file.id)"
              [disabled]="isDownloading()"
            >
              @if (isDownloading()) {
                <span class="loading loading-spinner loading-xs"></span>
              } @else {
                <span class="material-symbols-outlined">download</span>
              }
            </button>
            <button
              class="btn btn-ghost btn-sm text-error"
              (click)="deleteSubmission(submission.id)"
              [disabled]="isDeleting()"
            >
              @if (isDeleting()) {
                <span class="loading loading-spinner loading-xs"></span>
              } @else {
                <span class="material-symbols-outlined">delete</span>
              }
            </button>
          </div>
        </div>
        <p class="text-sm text-base-content/70">
          ¿Deseas reemplazar tu entrega? Elimina el archivo actual y sube uno nuevo.
        </p>
      } @else {
        <app-assignment-dropzone
          [maxSize]="maxFileSize"
          (filesChange)="onFilesChange($event)"
        />
        @if (selectedFiles().length > 0) {
          <button
            class="btn btn-primary w-full"
            (click)="submitAssignment()"
            [disabled]="isUploading()"
          >
            @if (isUploading()) {
              <span class="loading loading-spinner loading-sm"></span>
              Subiendo...
            } @else {
              <span class="material-symbols-outlined">upload</span>
              Entregar tarea
            }
          </button>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssignmentSubmissionForm {
  assignmentId = input.required<string>();

  private apollo = inject(Apollo);
  private toast = inject(Toast);

  selectedFiles = signal<UploadedFile[]>([]);
  isUploading = signal(false);
  isDeleting = signal(false);
  isDownloading = signal(false);

  maxFileSize = 50 * 1024 * 1024; // 50MB

  submissionResource = rxResource({
    params: () => ({ assignmentId: this.assignmentId() }),
    stream: ({ params }) => {
      return this.apollo
        .watchQuery<{ myAssignmentSubmission: AssignmentSubmission | null }>({
          query: gql`
            query MyAssignmentSubmission($assignmentId: String!) {
              myAssignmentSubmission(assignmentId: $assignmentId) {
                id
                assignmentId
                studentId
                fileId
                submittedAt
                file {
                  id
                  name
                  mimeType
                  size
                }
              }
            }
          `,
          variables: { assignmentId: params.assignmentId },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((res) => res.data.myAssignmentSubmission));
    },
  });

  hasSubmission = computed(() => !!this.submissionResource.value());

  onFilesChange(files: UploadedFile[]) {
    this.selectedFiles.set(files);
  }

  async submitAssignment() {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.toast.showError('Selecciona un archivo para entregar.');
      return;
    }

    const file = files[0].file;
    const mimeType = file.type || 'application/octet-stream';

    this.isUploading.set(true);

    this.apollo
      .mutate<{
        createSubmissionUploadUrl: { uploadUrl: string; storageKey: string };
      }>({
        mutation: gql`
          mutation CreateSubmissionUploadUrl($input: CreateSubmissionUploadInput!) {
            createSubmissionUploadUrl(input: $input) {
              uploadUrl
              storageKey
            }
          }
        `,
        variables: {
          input: {
            assignmentId: this.assignmentId(),
            fileName: file.name,
            mimeType,
          },
        },
      })
      .pipe(
        switchMap((result) => {
          const payload = result.data?.createSubmissionUploadUrl;
          if (!payload) {
            throw new Error('No se pudo obtener la URL de carga.');
          }
          return from(
            fetch(payload.uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': mimeType },
              body: file,
            }).then((response) => {
              if (!response.ok) {
                throw new Error('Error al subir el archivo.');
              }
              return payload;
            })
          );
        }),
        switchMap((payload) =>
          this.apollo.mutate<{ createAssignmentSubmission: AssignmentSubmission }>({
            mutation: gql`
              mutation CreateAssignmentSubmission(
                $input: CreateAssignmentSubmissionInput!
              ) {
                createAssignmentSubmission(input: $input) {
                  id
                  assignmentId
                  studentId
                  fileId
                  submittedAt
                  file {
                    id
                    name
                    mimeType
                    size
                  }
                }
              }
            `,
            variables: {
              input: {
                assignmentId: this.assignmentId(),
                fileName: file.name,
                mimeType,
                fileSize: file.size,
                storageKey: payload.storageKey,
              },
            },
          })
        )
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Tarea entregada correctamente.');
          this.selectedFiles.set([]);
          this.submissionResource.reload();
          this.isUploading.set(false);
        },
        error: (error) => {
          console.error(error);
          this.toast.showError(error.message || 'Error al entregar la tarea.');
          this.isUploading.set(false);
        },
      });
  }

  deleteSubmission(submissionId: string) {
    this.isDeleting.set(true);

    this.apollo
      .mutate<{ deleteAssignmentSubmission: boolean }>({
        mutation: gql`
          mutation DeleteAssignmentSubmission($submissionId: String!) {
            deleteAssignmentSubmission(submissionId: $submissionId)
          }
        `,
        variables: { submissionId },
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Entrega eliminada.');
          this.submissionResource.reload();
          this.isDeleting.set(false);
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar la entrega.');
          this.isDeleting.set(false);
        },
      });
  }

  downloadFile(fileId: string) {
    this.isDownloading.set(true);

    this.apollo
      .mutate<{ createSubmissionDownloadUrl: { downloadUrl: string } }>({
        mutation: gql`
          mutation CreateSubmissionDownloadUrl($fileId: String!) {
            createSubmissionDownloadUrl(fileId: $fileId) {
              downloadUrl
            }
          }
        `,
        variables: { fileId },
      })
      .subscribe({
        next: (result) => {
          const url = result.data?.createSubmissionDownloadUrl.downloadUrl;
          if (url) {
            window.open(url, '_blank');
          }
          this.isDownloading.set(false);
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al descargar el archivo.');
          this.isDownloading.set(false);
        },
      });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document'))
      return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'table_chart';
    return 'insert_drive_file';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }
}
