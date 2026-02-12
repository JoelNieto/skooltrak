import { markGroupDirty, Toast } from '@/ui';
import { Combobox, ComboboxInput, ComboboxPopupContainer } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  afterRenderEffect,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, of } from 'rxjs';
import Store from '../../core/store';
@Component({
  selector: 'app-courses-form',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    Combobox,
    ComboboxInput,
    ComboboxPopupContainer,
    Listbox,
    Option,
    OverlayModule,
  ],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="code">Código <span class="text-base-content/50 text-xs">(opcional)</span></label>
        <input type="text" id="code" name="code" formControlName="code" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="subjectInput">Asignatura</label>
        <div ngCombobox filterMode="highlight" class="relative">
          <div #origin class="autocomplete">
            <input
              id="subjectInput"
              aria-label="Buscar asignatura"
              placeholder="Buscar o crear asignatura..."
              [(ngModel)]="subjectQuery"
              [ngModelOptions]="{ standalone: true }"
              ngComboboxInput
              class="input input-primary w-full"
              (blur)="onSubjectBlur()"
            />
          </div>
          <ng-template ngComboboxPopupContainer>
            <ng-template
              [cdkConnectedOverlay]="{ origin, usePopover: 'inline', matchWidth: true }"
              [cdkConnectedOverlayOpen]="true"
            >
              <div
                class="popup bg-base-100 border border-base-300 rounded-box shadow-lg mt-1 max-h-60 overflow-auto z-50"
              >
                @if (filteredSubjects().length === 0 && subjectQuery().trim()) {
                  <div
                    class="p-3 cursor-pointer hover:bg-base-200 flex items-center gap-2"
                    tabindex="0"
                    role="button"
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
                <div ngListbox>
                  @for (subject of filteredSubjects(); track subject.id) {
                    <div
                      ngOption
                      [value]="subject.id"
                      [label]="subject.name"
                      tabindex="0"
                      class="p-3 cursor-pointer hover:bg-base-200 data-[active=true]:bg-base-200"
                      (click)="selectSubject(subject)"
                      (keydown.enter)="selectSubject(subject)"
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
        <select id="studyPlanId" name="studyPlanId" formControlName="studyPlanId" class="select select-primary">
          <option value="" disabled>Seleccionar plan</option>
          @for (studyPlan of studyPlans.value(); track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="teacherId">Docente</label>
        <select id="teacherId" name="teacherId" formControlName="teacherId" class="select select-primary">
          <option [value]="null" disabled>Seleccionar docente...</option>
          @for (teacher of teachers.value(); track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
    </div>
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
  private fb = inject(NonNullableFormBuilder);
  public data = input<{
    course?: Prisma.CourseGetPayload<{
      include: { school: true; subject: true; studyPlan: true };
    }>;
  }>();
  public closeModal = output<void>();
  private toast = inject(Toast);
  private apollo = inject(Apollo);
  private store = inject(Store);

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

  public listbox = viewChild<Listbox<string>>(Listbox);
  public options = viewChildren<Option<string>>(Option);
  public combobox = viewChild<Combobox<string>>(Combobox);

  public subjects = rxResource({
    stream: () => {
      return this.apollo
        .watchQuery<{ subjects: Prisma.SubjectGetPayload<false>[] }>({
          query: gql`
            query GetSubjects($take: Int!, $orderBy: String) {
              subjects(take: $take, orderBy: $orderBy) {
                id
                name
              }
            }
          `,
          variables: {
            take: 100,
            orderBy: 'name',
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.subjects));
    },
  });

  public studyPlans = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          studyPlansBySchoolId: Prisma.StudyPlanGetPayload<{
            include: { degree: true; school: true };
          }>[];
        }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  public form = this.fb.group({
    name: [''],
    shortName: [''],
    code: [''],
    subjectId: ['', [Validators.required]],
    studyPlanId: ['', [Validators.required]],
    teacherId: this.fb.control<string | null>(null),
  });

  public teachers = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          teachers: { id: string; name: string }[];
        }>({
          query: gql`
            query getTeachers($take: Int!, $skip: Int!, $search: String, $orderBy: String, $orderDirection: String) {
              teachers(take: $take, skip: $skip, search: $search, orderBy: $orderBy, orderDirection: $orderDirection) {
                id
                name
                initials
              }
            }
          `,
          variables: {
            take: 100,
            skip: 0,
            search: '',
            orderBy: 'firstName',
            orderDirection: 'asc',
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.teachers)),
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.course) {
        this.form.patchValue(this.data()!.course!);
        // Set selected subject for editing
        if (this.data()!.course!.subject) {
          this.selectedSubject.set({
            id: this.data()!.course!.subject.id,
            name: this.data()!.course!.subject.name,
          });
          this.subjectQuery.set(this.data()!.course!.subject.name);
        }
      }
    });

    // Scroll to active option when navigating
    afterRenderEffect(() => {
      const option = this.options().find((opt) => opt.active());
      if (option) {
        setTimeout(() => option.element.scrollIntoView({ block: 'nearest' }), 50);
      }
    });

    // Reset listbox scroll when combobox closes
    afterRenderEffect(() => {
      if (!this.combobox()?.expanded()) {
        setTimeout(() => this.listbox()?.element.scrollTo(0, 0), 150);
      }
    });
  }

  public selectSubject(subject: { id: string; name: string }) {
    this.selectedSubject.set(subject);
    this.subjectQuery.set(subject.name);
    this.form.patchValue({ subjectId: subject.id });
  }

  public onSubjectBlur() {
    const query = this.subjectQuery().trim().toLowerCase();
    if (!query) return;

    const filtered = this.filteredSubjects();
    // If there's exactly one match, select it
    if (filtered.length === 1) {
      this.selectSubject(filtered[0]);
      return;
    }
    // If the query exactly matches a subject name, select it
    const exactMatch = filtered.find(
      (s) => s.name.toLowerCase() === query
    );
    if (exactMatch) {
      this.selectSubject(exactMatch);
    }
  }

  public async createSubject() {
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
      const result = await firstValueFrom(
        this.apollo.mutate<{
          createSubject: { id: string; name: string; code: string };
        }>({
          mutation: gql`
            mutation CreateSubject($createSubjectInput: CreateSubjectInput!) {
              createSubject(createSubjectInput: $createSubjectInput) {
                id
                name
                code
              }
            }
          `,
          variables: {
            createSubjectInput: {
              name,
              code,
            },
          },
          refetchQueries: ['GetSubjects'],
        }),
      );

      if (result.data?.createSubject) {
        const newSubject = result.data.createSubject;
        this.selectSubject({ id: newSubject.id, name: newSubject.name });
        this.toast.showSuccess(`Asignatura "${name}" creada exitosamente`);
        // Reload subjects
        this.subjects.reload();
      }
    } catch (err: any) {
      this.toast.showError(err.message || 'Error al crear la asignatura');
    }
  }

  public onSubmit() {
    console.log(this.form.getRawValue());
    if (this.form.invalid) {
      this.toast.showError('Llenar todos los campos');
      markGroupDirty(this.form);
      return;
    }
    const req = this.form.getRawValue();
    if (this.data()?.course) {
      this.apollo
        .mutate({
          mutation: gql`
            mutation UpdateCourse($updateCourseInput: UpdateCourseInput!) {
              updateCourse(updateCourseInput: $updateCourseInput) {
                id
                name
                shortName
                code
                subjectId
                studyPlanId
              }
            }
          `,
          variables: {
            updateCourseInput: {
              ...req,
              id: this.data()!.course!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.closeModal.emit();
            this.toast.showSuccess('Curso actualizado exitosamente');
          },
          error: (err) => {
            this.toast.showError(err.message);
          },
        });
      return;
    }
    this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCourse($createCourseInput: CreateCourseInput!) {
            createCourse(createCourseInput: $createCourseInput) {
              id
              name
              shortName
              code
              subjectId
              studyPlanId
            }
          }
        `,
        variables: {
          createCourseInput: {
            ...req,
            organizationId: this.store.currentOrganizationId(),
            schoolId: this.store.currentSchoolId(),
          },
        },
      })
      .subscribe({
        next: () => {
          this.closeModal.emit();
          this.toast.showSuccess('Curso creado exitosamente');
        },
        error: (err) => {
          this.toast.showError(err.message);
        },
      });
  }
}
