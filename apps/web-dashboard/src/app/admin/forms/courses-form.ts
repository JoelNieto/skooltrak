import { Toast } from '#/ui';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { SubjectGetPayload } from 'generated/prisma/models';
import { firstValueFrom } from 'rxjs';
import { toFetchQueryParams } from '../../core/fetch-query-params';
import Store from '../../core/store';

interface CourseModel {
  id: string;
  name: string;
  shortName: string;
  code: string;
  subjectId: string;
  studyPlanId: string;
  teacherId: string;
  subject: SubjectGetPayload<{ include: undefined }>;
}
@Component({
  selector: 'app-courses-form',
  imports: [FormField, FormsModule, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="code">Código <span class="text-base-content/50 text-xs">(opcional)</span></label>
        <input type="text" id="code" [formField]="form.code" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="subjectInput">Asignatura</label>
        <div class="relative flex flex-col">
          <div #origin class="flex relative items-center input input-primary">
            <span class="search-icon material-symbols-outlined" translate="no" aria-hidden="true">search</span>
            <input
              #combobox="ngCombobox"
              ngCombobox
              id="subjectInput"
              aria-label="Buscar asignatura"
              autocomplete="off"
              placeholder="Buscar o crear asignatura..."
              [(value)]="subjectQuery"
              [(expanded)]="popupExpanded"
              (click)="popupExpanded.set(true)"
              class="w-full"
              (focusout)="onSubjectBlur()"
            />
            <button
              type="button"
              class="clear-button"
              aria-label="Clear"
              (mousedown)="$event.preventDefault()"
              (click)="clear()"
            >
              <span class="clear-icon material-symbols-outlined" translate="no" aria-hidden="true">close</span>
            </button>
          </div>
          <div aria-live="polite" class="cdk-visually-hidden">
            {{ filteredSubjects().length === 0 ? 'Sin asignaturas encontradas para "' + subjectQuery() + '"' : '' }}
          </div>
          <ng-template
            [cdkConnectedOverlay]="{ origin, usePopover: 'inline', matchWidth: true }"
            [cdkConnectedOverlayOpen]="popupExpanded()"
          >
            <ng-template ngComboboxPopup [combobox]="combobox">
              <div
                class="popup bg-base-100 border border-base-300 rounded-box w-full shadow-lg mt-1 max-h-60 overflow-auto z-50"
              >
                @if (filteredSubjects().length === 0 && subjectQuery().trim()) {
                   <div
                     class="p-3 cursor-pointer hover:bg-base-200 flex items-center gap-2"
                     tabindex="0"
                     role="button"
                     (mousedown)="$event.preventDefault()"
                     (click)="createSubject()"
                     (keydown.enter)="createSubject()"
                     (keydown.space)="createSubject(); $event.preventDefault()"
                   >
                    <span class="text-primary font-medium">+ Crear</span>
                    <span>"{{ subjectQuery() }}"</span>
                  </div>
                } @else if (filteredSubjects().length === 0) {
                  <div class="p-3 text-base-content/50">Escribe para buscar o crear una asignatura</div>
                }
                <div
                  #listbox="ngListbox"
                  ngListbox
                  ngComboboxWidget
                  focusMode="activedescendant"
                  [tabindex]="-1"
                  class="w-full"
                  [activeDescendant]="listbox.activeDescendant()"
                  [(value)]="selectedOption"
                  (click)="onSubjectCommit()"
                  (keydown.enter)="onSubjectCommit()"
                >
                  @for (subject of filteredSubjects(); track subject.id) {
                    <div
                      ngOption
                      [value]="subject.id"
                      [label]="subject.name"
                      tabindex="0"
                      class="p-3 cursor-pointer hover:bg-base-200 data-[active=true]:bg-base-200"
                    >
                      {{ subject.name }}
                    </div>
                  }
                </div>
              </div>
            </ng-template>
          </ng-template>
        </div>
        @if (selectedSubject()) {
          <div class="mt-1 text-sm text-base-content/70">
            Seleccionado: <span class="font-medium">{{ selectedSubject()?.name }}</span>
          </div>
        }
      </div>
      <div class="fieldset">
        <label for="studyPlanId">Plan de estudio</label>
        <select id="studyPlanId" [formField]="form.studyPlanId" class="select select-primary">
          <option value="" disabled>Seleccionar plan</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="teacherId">Docente</label>
        <select id="teacherId" [formField]="form.teacherId" class="select select-primary">
          <option [value]="null" disabled>Seleccionar docente...</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
    </div>
    @if (errorMessage()) {
      <div role="alert" class="alert alert-error mt-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ errorMessage() }}</span>
      </div>
    }
    <div class="flex justify-end gap-2 mt-4">
      <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  </form>`,

  styles: `
    [ngCombobox]:has([aria-expanded='false']) .popup {
      display: none;
    }
  `,
})
export default class CoursesForm {
  clear() {
    this.subjectQuery.set('');
    this.selectedOption.set([]);
    this.popupExpanded.set(false);
  }
  public data = input<{
    course?: CourseModel;
  }>();
  public closeModal = output<void>();
  private toast = inject(Toast);
  private http = inject(HttpClient);
  private store = inject(Store);

  // Error message signal
  public errorMessage = signal('');

  // Subject autocomplete signals
  public subjectQuery = signal('');
  public selectedSubject = signal<{ id: string; name: string } | null>(null);

  public filteredSubjects = computed(() => {
    const query = this.subjectQuery().toLowerCase().trim();
    const subjects = this.subjects.value() ?? [];
    if (!query) {
      return subjects;
    }
    return subjects.filter((subject) => subject.name.toLowerCase().includes(query));
  });

  readonly listbox = viewChild(Listbox);
  selectedOption = signal<string[]>([]);
  public combobox = viewChild(Combobox);
  popupExpanded = signal(false);

  public subjects = httpResource<{ id: string; name: string }[]>(() => ({
    url: '/api/v1/subjects',
    params: toFetchQueryParams({ take: 100, orderBy: 'name' }),
    defaultValue: [],
  }));

  public studyPlans = httpResource<{ id: string; name: string }[]>(() => {
    const currentSchoolId = this.store.currentSchoolId();
    if (!currentSchoolId) return undefined;

    return {
      url: `/api/v1/study-plans/by-school`,
      params: { schoolId: currentSchoolId },
    };
  });

  public formModel = signal<{
    name: string;
    shortName: string;
    code: string;
    subjectId: string;
    studyPlanId: string;
    teacherId: string;
  }>({ name: '', shortName: '', code: '', subjectId: '', studyPlanId: '', teacherId: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.subjectId, { message: 'Asignatura requerida' });
    required(schemaPath.studyPlanId, { message: 'Plan requerido' });
  });

  public teachers = httpResource<{ id: string; name: string }[]>(() => ({
    url: '/api/v1/teachers',
    params: toFetchQueryParams({
      take: 100,
      orderBy: 'firstName',
      orderDirection: 'asc',
    }),
  }));

  constructor() {
    afterRenderEffect(() => {
      const course = this.data()?.course;
      if (course) {
        this.formModel.set(course);
        // Set selected subject for editing
        if (course.subject) {
          this.selectedSubject.set({
            id: course.subject.id,
            name: course.subject.name,
          });
          this.subjectQuery.set(course.subject.name);
        }
      }
    });

    // Reset listbox scroll when combobox closes
    afterRenderEffect(() => {
      if (this.combobox()?.expanded() === true) {
        this.listbox()?.scrollActiveItemIntoView();
      }
    });
  }

  public onSubjectBlur() {
    this.commitSelection();
  }

  onSubjectCommit() {
    this.commitSelection();
    this.popupExpanded.set(false);
    this.combobox()?.element.focus();
  }

  public async createSubject() {
    console.log('Creating subject with name:', this.subjectQuery());
    const name = this.subjectQuery().trim();
    if (!name) {
      this.toast.showError('El nombre de la asignatura es requerido');
      return;
    }

    // Auto-generate code from name (first 3-4 uppercase letters)
    const code =
      name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 4) || name.substring(0, 4).toUpperCase();

    try {
      const created = await firstValueFrom(
        this.http.post<{ id: string; name: string }>('/api/v1/subjects', {
          name,
          code,
        }),
      );

      this.toast.showSuccess(`Asignatura "${name}" creada exitosamente`);
      // Reload subjects and select the newly created one
      await this.subjects.reload();
      this.selectedSubject.set({ id: created.id, name: created.name });
      this.form.subjectId().value.set(created.id);
      this.subjectQuery.set(created.name);
      this.popupExpanded.set(false);
    } catch (err: any) {
      this.toast.showError(err.message || 'Error al crear la asignatura');
    }
  }

  commitSelection() {
    const selected = this.selectedOption();

    if (selected.length > 0) {
      const option = this.filteredSubjects().filter((x) => selected.includes(x.id));
      this.form.subjectId().value.set(option[0].id);
      this.subjectQuery.set(option[0].name);
    } else {
      this.subjectQuery.set('');
      this.selectedOption.set([]);
    }
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    if (!this.form().valid()) {
      this.toast.showError('Llenar todos los campos');
      return;
    }
    const req = this.formModel();
    if (this.data()?.course) {
      this.http
        .patch('/api/v1/courses', {
          ...req,
          id: this.data()!.course!.id,
        })
        .subscribe({
          next: () => {
            this.closeModal.emit();
            this.toast.showSuccess('Curso actualizado exitosamente');
          },
          error: (err) => {
            this.errorMessage.set(this.extractErrorMessage(err));
          },
        });
      return;
    }
    this.http
      .post('/api/v1/courses', {
        ...req,
        teacherId: req.teacherId || null,
        organizationId: this.store.currentOrganizationId() ?? '',
        schoolId: this.store.currentSchoolId() ?? '',
      })
      .subscribe({
        next: () => {
          this.closeModal.emit();
          this.toast.showSuccess('Curso creado exitosamente');
        },
        error: (err) => {
          this.errorMessage.set(this.extractErrorMessage(err));
        },
      });
  }

  private extractErrorMessage(err: unknown): string {
    const anyErr = err as { error?: { message?: string }; graphQLErrors?: { message?: string }[]; message?: string };
    const message =
      anyErr?.error?.message ?? anyErr?.graphQLErrors?.[0]?.message ?? anyErr?.message ?? 'Error inesperado';
    return message.replace(/^(ConflictException:\s*)/i, '');
  }
}
