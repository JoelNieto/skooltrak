import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import AssignmentDropzone, { UploadedFile } from './assignment-dropzone';

interface MySubmission {
  id: string;
  submittedAt: string;
  file: { id: string; name: string; mimeType: string; size: number };
}

@Component({
  selector: 'app-assignment-submission-form',
  imports: [AssignmentDropzone, DatePipe],
  template: `
    <div class="space-y-4">
      @if (submissionResource.isLoading()) {
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (submissionResource.value(); as submission) {
        <div class="alert alert-success">
          <span class="material-symbols-outlined">check_circle</span>
          <div>
            <h3 class="font-bold">Entrega completada</h3>
            <p class="text-sm">Entregaste el {{ submission.submittedAt | date: 'medium' }}</p>
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
        <app-assignment-dropzone [maxSize]="maxFileSize" (filesChange)="onFilesChange($event)" />
        @if (selectedFiles().length > 0) {
          <button class="btn btn-primary w-full" (click)="submitAssignment()" [disabled]="isUploading()">
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

  private http = inject(HttpClient);
  private toast = inject(Toast);

  selectedFiles = signal<UploadedFile[]>([]);
  isUploading = signal(false);
  isDeleting = signal(false);
  isDownloading = signal(false);

  maxFileSize = 50 * 1024 * 1024; // 50MB

  submissionResource = rxResource({
    params: () => ({ assignmentId: this.assignmentId() }),
    stream: ({ params }) =>
      this.http.get<MySubmission | null>('/api/v1/assignment-submissions/mine', {
        params: { assignmentId: params.assignmentId },
      }),
  });

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

    try {
      const payload = await firstValueFrom(
        this.http.post<{ uploadUrl: string; storageKey: string }>('/api/v1/assignment-submissions/upload-url', {
          assignmentId: this.assignmentId(),
          fileName: file.name,
          mimeType,
        }),
      );

      const response = await fetch(payload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      });
      if (!response.ok) {
        throw new Error('Error al subir el archivo.');
      }

      await firstValueFrom(
        this.http.post('/api/v1/assignment-submissions', {
          assignmentId: this.assignmentId(),
          fileName: file.name,
          mimeType,
          fileSize: file.size,
          storageKey: payload.storageKey,
        }),
      );

      this.toast.showSuccess('Tarea entregada correctamente.');
      this.selectedFiles.set([]);
      this.submissionResource.reload();
    } catch (error: unknown) {
      console.error(error);
      this.toast.showError(error instanceof Error ? error.message : 'Error al entregar la tarea.');
    } finally {
      this.isUploading.set(false);
    }
  }

  deleteSubmission(submissionId: string) {
    this.isDeleting.set(true);

    firstValueFrom(this.http.delete(`/api/v1/assignment-submissions/${submissionId}`))
      .then(() => {
        this.toast.showSuccess('Entrega eliminada.');
        this.submissionResource.reload();
      })
      .catch((error) => {
        console.error(error);
        this.toast.showError('Error al eliminar la entrega.');
      })
      .finally(() => this.isDeleting.set(false));
  }

  downloadFile(fileId: string) {
    this.isDownloading.set(true);

    firstValueFrom(this.http.get<{ downloadUrl: string }>(`/api/v1/assignment-submissions/download-url/${fileId}`))
      .then((result) => {
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
        }
      })
      .catch((error) => {
        console.error(error);
        this.toast.showError('Error al descargar el archivo.');
      })
      .finally(() => this.isDownloading.set(false));
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart';
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
