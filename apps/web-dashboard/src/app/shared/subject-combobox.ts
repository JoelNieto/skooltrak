import { ComboboxOption, Toast, UiCombobox } from '#/ui';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toFetchQueryParams } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';

interface SubjectSummary {
  id: string;
  name: string;
}

/**
 * Subject picker: searches the organization's subjects and creates a missing one from the typed
 * name. The value is the subject id ('' when none).
 *
 *   <ui-field label="Asignatura" [field]="form.subjectId">
 *     <app-subject-combobox [formField]="form.subjectId" />
 *   </ui-field>
 *
 * Set `creatable="false"` where only existing subjects may be chosen.
 */
@Component({
  selector: 'app-subject-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCombobox],
  template: `
    <ui-combobox
      [(value)]="value"
      [options]="options()"
      [disabled]="disabled() || creating()"
      [creatable]="creatable()"
      createLabel="Crear asignatura"
      placeholder="Buscar o crear asignatura…"
      ariaLabel="Asignatura"
      emptyText="Sin asignaturas"
      hintText="Escribe para buscar o crear una asignatura"
      (create)="create($event)"
      (touch)="touch.emit()"
    />
  `,
})
export class SubjectCombobox {
  /** Selected subject id; '' when none. */
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly creatable = input(true, { transform: booleanAttribute });
  /** Signal forms: marks the field touched. */
  readonly touch = output<void>();

  private readonly http = inject(HttpClient);
  private readonly toast = inject(Toast);
  private readonly combobox = viewChild.required(UiCombobox);

  protected readonly creating = signal(false);
  /** Subjects created here, listed before the reload brings them back from the API. */
  private readonly created = signal<ComboboxOption[]>([]);

  private readonly subjects = httpResource<PaginatedResponse<SubjectSummary>>(() => ({
    url: '/api/v1/subjects',
    params: toFetchQueryParams({ pageSize: 100, orderBy: 'name' }),
  }));

  protected readonly options = computed<ComboboxOption[]>(() => {
    const loaded = (this.subjects.value()?.data ?? []).map((s) => ({ value: s.id, label: s.name }));
    const extra = this.created().filter((c) => !loaded.some((o) => o.value === c.value));
    return [...loaded, ...extra].sort((a, b) => a.label.localeCompare(b.label));
  });

  focus(options?: FocusOptions): void {
    this.combobox().focus(options);
  }

  protected async create(name: string): Promise<void> {
    if (!name || this.creating()) return;
    this.creating.set(true);
    try {
      const subject = await firstValueFrom(
        this.http.post<SubjectSummary>('/api/v1/subjects', { name, code: subjectCode(name) }),
      );
      this.created.update((list) => [...list, { value: subject.id, label: subject.name }]);
      this.value.set(subject.id);
      this.subjects.reload();
      this.toast.showSuccess(`Asignatura "${subject.name}" creada`);
    } catch (err) {
      const message = err instanceof HttpErrorResponse ? err.error?.message : undefined;
      this.toast.showError(message || 'No se pudo crear la asignatura');
    } finally {
      this.creating.set(false);
    }
  }
}

/** Initials of the name, up to 4 letters ("Ciencias Naturales" → "CN"). */
function subjectCode(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4);
  return initials || name.substring(0, 4).toUpperCase();
}
