import { Alert, Badge, Button, Card, Spinner, Toast, UiTable } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-assignment-submissions-list',
  imports: [Alert, Spinner, Card, UiTable, Badge, Button],
  template: `
    <div class="space-y-4">
      @if (studentsResource.isLoading()) {
        <div class="flex items-center justify-center py-8">
          <span uiSpinner></span>
        </div>
      } @else if (studentsResource.error()) {
        <div uiAlert tone="danger">
          <span class="material-symbols-outlined">error</span>
          <span>Error al cargar los estudiantes.</span>
        </div>
      } @else if (studentsResource.hasValue()) {
        @let students = studentsResource.value()!;
        <div class="flex items-center justify-between mb-4">
          <div class="stats shadow">
            <div class="stat py-2 px-4">
              <div class="stat-title text-xs">Entregados</div>
              <div class="stat-value text-lg text-success">
                {{ getSubmittedCount(students) }}
              </div>
            </div>
            <div class="stat py-2 px-4">
              <div class="stat-title text-xs">Pendientes</div>
              <div class="stat-value text-lg text-warning">
                {{ getPendingCount(students) }}
              </div>
            </div>
            <div class="stat py-2 px-4">
              <div class="stat-title text-xs">Total</div>
              <div class="stat-value text-lg">{{ students.length }}</div>
            </div>
          </div>
        </div>

        <div uiCard class="overflow-x-auto">
          <table uiTable>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Estado</th>
                <th>Fecha de entrega</th>
                <th>Archivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (student of students; track student.id ?? '') {
                @let submission = student.assignmentSubmissions[0];
                <tr>
                  <td>
                    <div class="font-medium">
                      {{ student.fatherName }} {{ student.motherName }},
                      {{ student.firstName }}
                    </div>
                  </td>
                  <td>
                    @if (submission) {
                      <div class="flex flex-wrap gap-1">
                        <span uiBadge tone="success" size="sm" class="gap-1">
                          <span class="material-symbols-outlined text-sm!" aria-hidden="true">check</span>
                          Entregado
                        </span>
                        @if (submission.reviewedAt) {
                          <span uiBadge tone="info" size="sm" class="gap-1">
                            <span class="material-symbols-outlined text-sm!" aria-hidden="true">done_all</span>
                            Revisada
                          </span>
                        }
                      </div>
                    } @else {
                      <span uiBadge tone="warning" size="sm" class="gap-1">
                        <span class="material-symbols-outlined text-sm!" aria-hidden="true">schedule</span>
                        Pendiente
                      </span>
                    }
                  </td>
                  <td class="text-ink-muted text-sm">
                    @if (submission) {
                      {{ formatSubmissionDate(submission.submittedAt) }}
                    } @else {
                      -
                    }
                  </td>
                  <td>
                    @if (submission) {
                      <div class="flex items-center gap-2">
                        <span
                          class="material-symbols-outlined text-lg"
                          [class.text-error]="submission.file.mimeType.includes('pdf')"
                          [class.text-info]="
                            submission.file.mimeType.includes('word') || submission.file.mimeType.includes('document')
                          "
                        >
                          {{ getFileIcon(submission.file.mimeType) }}
                        </span>
                        <span class="text-sm truncate max-w-37.5">
                          {{ submission.file.name }}
                        </span>
                        <span class="text-xs text-ink-subtle"> ({{ formatBytes(submission.file.size) }}) </span>
                      </div>
                    } @else {
                      <span class="text-ink-subtle text-sm">-</span>
                    }
                  </td>
                  <td>
                    <div class="flex items-center justify-end gap-1">
                      @if (submission) {
                        <button
                          uiButton
                          variant="ghost"
                          size="sm"
                          type="button"
                          [loading]="reviewingId() === submission.id"
                          [disabled]="reviewingId() === submission.id"
                          (click)="toggleReviewed(submission)"
                        >
                          {{ submission.reviewedAt ? 'Quitar revisión' : 'Marcar revisada' }}
                        </button>
                      }
                      @let fileId = $safeNavigationMigration(submission?.file?.id);
                      @if (fileId) {
                        <button
                          uiButton
                          [loading]="downloadingFileId() === fileId"
                          variant="ghost"
                          size="sm"
                          (click)="downloadFile(fileId)"
                          [disabled]="downloadingFileId() === fileId"
                        >
                          @if (!(downloadingFileId() === fileId)) {
                            <span class="material-symbols-outlined" aria-hidden="true">download</span>
                            <span class="sr-only">Descargar</span>
                          }
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center text-ink-subtle py-8">
                    No hay estudiantes inscritos en este curso.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export default class AssignmentSubmissionsList {
  assignmentId = input.required<string>();

  private http = inject(HttpClient);
  private toast = inject(Toast);

  downloadingFileId = signal<string | null>(null);
  reviewingId = signal<string | null>(null);

  studentsResource = httpResource<
    {
      id: string;
      firstName: string;
      fatherName: string;
      motherName: string;
      assignmentSubmissions: Array<{
        id: string;
        reviewedAt?: string | null;
        submittedAt?: string | Date | null;
        file: { id: string; name: string; mimeType: string; size: number };
      }>;
    }[]
  >(() => `/api/v1/assignment-submissions/students-for-assignment/${this.assignmentId()}`);

  /** BR-HOM-001.17: the course's teacher marks a submission reviewed (feeds "Entregas por revisar"). */
  async toggleReviewed(submission: { id: string; reviewedAt?: string | null }) {
    this.reviewingId.set(submission.id);
    try {
      await firstValueFrom(
        this.http.patch(`/api/v1/assignment-submissions/${submission.id}/review`, { reviewed: !submission.reviewedAt }),
      );
      this.studentsResource.reload();
    } catch (error) {
      const message = (error as { error?: { message?: string } })?.error?.message;
      this.toast.showError(message || 'No se pudo actualizar la revisión.');
    } finally {
      this.reviewingId.set(null);
    }
  }

  getSubmittedCount(students: Array<{ assignmentSubmissions?: unknown[] }>): number {
    return students.filter((s) => (s.assignmentSubmissions?.length ?? 0) > 0).length;
  }

  getPendingCount(students: Array<{ assignmentSubmissions?: unknown[] }>): number {
    return students.filter((s) => (s.assignmentSubmissions?.length ?? 0) === 0).length;
  }

  async downloadFile(fileId: string) {
    this.downloadingFileId.set(fileId);
    try {
      const res = await firstValueFrom(
        this.http.get<{ downloadUrl?: string }>(`/api/v1/assignment-submissions/download-url/${fileId}`),
      );
      const url = res?.downloadUrl;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error(error);
      this.toast.showError('Error al descargar el archivo.');
    } finally {
      this.downloadingFileId.set(null);
    }
  }

  formatSubmissionDate(value: unknown): string {
    if (value == null) return '-';
    const date = value instanceof Date ? value : new Date(String(value));
    // toLocaleDateString rejects timeStyle (TypeError), which broke the list whenever a submission existed.
    return isNaN(date.getTime()) ? '-' : date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
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
