import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import StudentSearch from '../../admin/components/student-search';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';

type Target = 'student' | 'group';

/**
 * "Nuevo cargo" (FR-FIN-001.7): a manual charge for one student, or for every active student of a
 * class group. Opened from an account, it only offers that account's students.
 */
@Component({
  selector: 'app-finance-charge-form',
  imports: [Button, FormField, StudentSearch, UiField, UiInput, UiSelect],
  template: `
    <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
      @if (accountStudents().length) {
        <ui-field label="Estudiante" [field]="form.studentId">
          <select uiSelect [formField]="form.studentId">
            @for (s of accountStudents(); track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </ui-field>
      } @else {
        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-medium text-ink-strong mb-1">Para</legend>
          <div class="flex gap-2" role="radiogroup" aria-label="Para quién es el cargo">
            <button
              uiButton
              type="button"
              size="sm"
              [variant]="target() === 'student' ? 'primary' : 'secondary'"
              [attr.aria-pressed]="target() === 'student'"
              (click)="target.set('student')"
            >
              Un estudiante
            </button>
            <button
              uiButton
              type="button"
              size="sm"
              [variant]="target() === 'group' ? 'primary' : 'secondary'"
              [attr.aria-pressed]="target() === 'group'"
              (click)="target.set('group')"
            >
              Un grupo completo
            </button>
          </div>
        </fieldset>
        @if (target() === 'student') {
          <app-student-search (selected)="form.studentId().value.set($event.id)" />
        } @else {
          <ui-field label="Grupo" [field]="form.classGroupId" hint="Se crea un cargo para cada estudiante activo del grupo.">
            <select uiSelect [formField]="form.classGroupId">
              <option value="" disabled>Selecciona un grupo…</option>
              @for (g of groups.value()?.data ?? []; track g.id) {
                <option [value]="g.id">{{ g.name }}</option>
              }
            </select>
          </ui-field>
        }
      }

      <ui-field label="Concepto" [field]="form.description">
        <input uiInput type="text" placeholder="Ej.: Excursión a Panamá Viejo" [formField]="form.description" />
      </ui-field>
      <div class="grid grid-cols-2 gap-4">
        <ui-field label="Monto" [field]="form.amount">
          <input uiInput type="number" step="0.01" inputmode="decimal" [formField]="form.amount" />
        </ui-field>
        <ui-field label="Vence" [field]="form.dueDate">
          <input uiInput type="date" [formField]="form.dueDate" />
        </ui-field>
      </div>

      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving()">Crear cargo</button>
      </div>
    </form>
  `,
})
export default class ChargeForm {
  readonly data = input<{ students?: { id: string; name: string }[] }>();
  readonly closeModal = output<void>();

  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  protected readonly accountStudents = computed(() => this.data()?.students ?? []);
  protected readonly target = signal<Target>('student');
  protected readonly saving = signal(false);

  private model = signal({ studentId: '', classGroupId: '', description: '', amount: 0, dueDate: '' });
  protected readonly form = form(this.model, (p) => {
    required(p.description, { message: 'Escribe el concepto' });
    maxLength(p.description, 200, { message: 'Máximo 200 caracteres' });
    required(p.amount, { message: 'Indica el monto' });
    min(p.amount, 0.01, { message: 'El monto debe ser mayor que cero' });
    required(p.dueDate, { message: 'Indica la fecha de vencimiento' });
  });

  protected readonly groups = httpResource<PaginatedResponse<{ id: string; name: string }>>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId || this.accountStudents().length || this.target() !== 'group') return undefined;
    return { url: '/api/v1/class-groups', params: toFetchQueryRecord({ schoolId, page: 1, pageSize: 100 }) };
  });

  constructor() {
    // From an account: start on its first student.
    effect(() => {
      const first = this.accountStudents()[0];
      if (first) untracked(() => !this.model().studentId && this.form.studentId().value.set(first.id));
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return;
    const v = this.model();
    const byGroup = !this.accountStudents().length && this.target() === 'group';
    if (this.form().invalid() || (byGroup ? !v.classGroupId : !v.studentId)) {
      this.form.description().markAsTouched();
      this.form.amount().markAsTouched();
      this.form.dueDate().markAsTouched();
      this.toast.showError(byGroup ? 'Elige un grupo' : !v.studentId ? 'Elige un estudiante' : 'Revisa los campos');
      return;
    }
    this.saving.set(true);
    try {
      const result = await firstValueFrom(
        this.http.post<{ created: number }>('/api/v1/finance/charges', {
          schoolId,
          ...(byGroup ? { classGroupId: v.classGroupId } : { studentId: v.studentId }),
          description: v.description.trim(),
          amount: Number(v.amount),
          dueDate: v.dueDate,
        }),
      );
      this.toast.showSuccess(result.created === 1 ? 'Cargo creado' : `${result.created} cargos creados`);
      this.closeModal.emit();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string | string[] } })?.error?.message;
      this.toast.showError((Array.isArray(message) ? message[0] : message) ?? 'No se pudo crear el cargo');
    } finally {
      this.saving.set(false);
    }
  }
}
