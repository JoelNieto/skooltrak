import { Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import {
  CreateSubmissionDownloadUrlDocument,
  StudentsForAssignmentDocument,
  StudentsForAssignmentQuery,
} from '../graphql/generated/graphql';

@Component({
  selector: 'app-assignment-submissions-list',
  template: `
    <div class="space-y-4">
      @if (studentsResource.isLoading()) {
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (studentsResource.error()) {
        <div class="alert alert-error">
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

        <div class="overflow-x-auto bg-base-100 rounded-lg">
          <table class="table">
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
                      <span class="badge badge-success badge-sm gap-1">
                        <span class="material-symbols-outlined text-sm!">check</span>
                        Entregado
                      </span>
                    } @else {
                      <span class="badge badge-warning badge-sm gap-1">
                        <span class="material-symbols-outlined text-sm!">schedule</span>
                        Pendiente
                      </span>
                    }
                  </td>
                  <td class="text-base-content/70 text-sm">
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
                        <span class="text-xs text-base-content/50"> ({{ formatBytes(submission.file.size) }}) </span>
                      </div>
                    } @else {
                      <span class="text-base-content/50 text-sm">-</span>
                    }
                  </td>
                  <td>
                    @let fileId = submission?.file?.id;
                    @if (fileId) {
                      <button
                        class="btn btn-ghost btn-sm"
                        (click)="downloadFile(fileId)"
                        [disabled]="downloadingFileId() === fileId"
                      >
                        @if (downloadingFileId() === fileId) {
                          <span class="loading loading-spinner loading-xs"></span>
                        } @else {
                          <span class="material-symbols-outlined">download</span>
                        }
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center text-base-content/50 py-8">
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssignmentSubmissionsList {
  assignmentId = input.required<string>();

  private apollo = inject(Apollo);
  private toast = inject(Toast);

  downloadingFileId = signal<string | null>(null);

  studentsResource = rxResource({
    params: () => ({ assignmentId: this.assignmentId() }),
    stream: ({ params }) => {
      return this.apollo
        .watchQuery({
          query: StudentsForAssignmentDocument,
          variables: { assignmentId: params.assignmentId },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((res) => (res.data?.studentsForAssignment as StudentsForAssignmentQuery['studentsForAssignment']) ?? []),
        );
    },
  });

  getSubmittedCount(students: Array<{ assignmentSubmissions?: unknown[] }>): number {
    return students.filter((s) => (s.assignmentSubmissions?.length ?? 0) > 0).length;
  }

  getPendingCount(students: Array<{ assignmentSubmissions?: unknown[] }>): number {
    return students.filter((s) => (s.assignmentSubmissions?.length ?? 0) === 0).length;
  }

  downloadFile(fileId: string) {
    this.downloadingFileId.set(fileId);

    this.apollo
      .mutate({
        mutation: CreateSubmissionDownloadUrlDocument,
        variables: { fileId },
      })
      .subscribe({
        next: (result) => {
          const url = result.data?.createSubmissionDownloadUrl?.downloadUrl;
          if (url) {
            window.open(url, '_blank');
          }
          this.downloadingFileId.set(null);
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al descargar el archivo.');
          this.downloadingFileId.set(null);
        },
      });
  }

  formatSubmissionDate(value: unknown): string {
    if (value == null) return '-';
    const date = value instanceof Date ? value : new Date(String(value));
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' });
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
