import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-imports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold">Importación masiva</h1>

      @if (!store.currentSchoolId()) {
        <div class="alert alert-warning">Selecciona una escuela antes de importar.</div>
      } @else {
        <!-- Step 1: Upload -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Paso 1: Cargar CSV</h2>
            <div class="flex flex-col gap-4">
              <label class="select select-bordered w-full max-w-xs">
                <span class="material-symbols-outlined">school</span>
                <span>Entidad</span>
                <select [ngModel]="entityType()" (ngModelChange)="entityType.set($event)">
                  <option value="STUDENT">Estudiantes</option>
                  <option value="TEACHER">Profesores</option>
                </select>
              </label>

              <div class="flex flex-col gap-2">
                <label class="block text-sm font-medium" for="csv-file">Archivo CSV</label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  class="file-input file-input-bordered w-full max-w-xs"
                  (change)="onFileSelected($event)"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="block text-sm font-medium" for="csv-text">O pega el contenido CSV</label>
                <textarea
                  id="csv-text"
                  class="textarea textarea-bordered w-full h-40"
                  placeholder="firstName,middleName,fatherName,motherName,documentId,birthDate,gender,address,phone&#10;Juan,,Perez,Garcia,12345678,2010-05-01,MASCULINO,Calle 1,555-1234"
                  [value]="csvText()"
                  (input)="onCsvInput($event)"
                ></textarea>
              </div>

              <button class="btn btn-primary w-fit" [disabled]="loading() || !canDryRun" (click)="runDryRun()">
                @if (loading()) {
                  <span class="loading loading-spinner loading-sm"></span>
                } @else {
                  <span class="material-symbols-outlined">visibility</span>
                }
                Validar (dry-run)
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Preview -->
        @if (dryRunResult()) {
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Paso 2: Vista previa</h2>
              <div class="flex gap-4 mb-4">
                <span class="badge badge-success">Válidos: {{ dryRunResult()?.validRows }}</span>
                <span class="badge badge-error">Errores: {{ dryRunResult()?.errorRows }}</span>
                <span class="badge badge-ghost">Total: {{ dryRunResult()?.totalRows }}</span>
              </div>
              <div class="overflow-x-auto max-h-96">
                <table class="table table-sm table-zebra">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Estado</th>
                      <th>Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of dryRunResult()?.results; track row.rowNumber) {
                      <tr>
                        <td>{{ row.rowNumber }}</td>
                        <td>
                          @if (row.errors.length === 0) {
                            <span class="badge badge-success badge-sm">{{ row.action }}</span>
                          } @else {
                            <span class="badge badge-error badge-sm">SKIP</span>
                          }
                        </td>
                        <td class="text-error text-xs">{{ row.errors.join('; ') }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="card-actions justify-end mt-4">
                <button
                  class="btn btn-primary"
                  [disabled]="dryRunResult()?.validRows === 0 || loading()"
                  (click)="commit()"
                >
                  @if (loading()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  } @else {
                    <span class="material-symbols-outlined">check</span>
                  }
                  Confirmar importación
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Result -->
        @if (commitResult()) {
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Importación completada</h2>
              <div class="flex gap-4 mb-4">
                <span class="badge badge-success">Creados: {{ commitResult()?.validRows }}</span>
                <span class="badge badge-error">Errores: {{ commitResult()?.errorRows }}</span>
              </div>
              <div class="card-actions justify-end">
                <button class="btn btn-ghost" (click)="downloadErrors()">Descargar errores CSV</button>
                <button class="btn btn-primary" (click)="reset()">Nueva importación</button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export default class Imports {
  private http = inject(HttpClient);
  private toast = inject(Toast);
  public store = inject(Store);

  csvText = signal('');
  entityType = signal<'STUDENT' | 'TEACHER'>('STUDENT');
  loading = signal(false);
  dryRunResult = signal<any>(null);
  commitResult = signal<any>(null);
  jobId = signal<string | null>(null);

  get canDryRun(): boolean {
    return !!this.csvText().trim() && !!this.store.currentSchoolId();
  }

  onCsvInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.csvText.set(input.value);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.csvText.set(reader.result as string);
    };
    reader.readAsText(file);
  }

  async runDryRun() {
    if (!this.canDryRun) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom<any>(
        this.http.post<any>('/api/v1/imports/dry-run', {
          organizationId: this.store.currentOrganizationId(),
          schoolId: this.store.currentSchoolId(),
          entityType: this.entityType(),
          csvText: this.csvText(),
        }),
      );
      this.dryRunResult.set(res);
      this.jobId.set(res.jobId);
      this.toast.showSuccess(`Validación completada: ${res.validRows} filas válidas`);
    } catch (err: any) {
      this.toast.showError(err?.error?.message || 'Error en dry-run');
    } finally {
      this.loading.set(false);
    }
  }

  async commit() {
    if (!this.jobId()) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom<any>(this.http.post<any>(`/api/v1/imports/${this.jobId()}/commit`, {}));
      this.commitResult.set(res);
      this.toast.showSuccess(`Importación completada: ${res.validRows} creados`);
    } catch (err: any) {
      this.toast.showError(err?.error?.message || 'Error al confirmar importación');
    } finally {
      this.loading.set(false);
    }
  }

  downloadErrors() {
    if (!this.commitResult()?.results && !this.dryRunResult()?.results) return;
    const rows = this.commitResult()?.results || this.dryRunResult()?.results || [];
    const errorRows = rows.filter((r: any) => r.errors.length > 0);
    if (errorRows.length === 0) {
      this.toast.showError('No hay errores para descargar');
      return;
    }
    const headers = ['rowNumber', 'action', 'errors'];
    const csv = [
      headers.join(','),
      ...errorRows.map((r: any) => `${r.rowNumber},${r.action},"${(r.errors || []).join('; ')}"`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  reset() {
    this.dryRunResult.set(null);
    this.commitResult.set(null);
    this.jobId.set(null);
    this.csvText.set('');
  }
}
