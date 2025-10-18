import { markGroupDirty, Toast } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-degrees-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-2">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          formControlName="name"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          formControlName="shortName"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="schoolId">Escuela</label>
        <select
          id="schoolId"
          formControlName="schoolId"
          class="select select-primary"
        >
          @for (school of schools.value(); track school.id) {
          <option [value]="school.id">{{ school.name }}</option>
          }
        </select>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()" type="button">
        Cancelar
      </button>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DegreesForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  public store = inject(Store);
  public data = input<{
    degree?: Prisma.DegreeGetPayload<{ include: { school: true } }>;
  }>();
  public closeModal = output<void>();
  private apollo = inject(Apollo);
  private toasts = inject(Toast);
  public schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          schools: Prisma.SchoolGetPayload<{
            include: undefined;
          }>[];
        }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetSchools {
              schools {
                id
                name
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.schools)),
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    schoolId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.store.currentSchoolId()) {
      this.form.get('schoolId')?.setValue(this.store.currentSchoolId()!);
    }
    if (this.data()?.degree) {
      this.form.patchValue(this.data()!.degree!);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    const request = this.form.getRawValue();

    if (this.data()?.degree) {
      this.apollo
        .mutate<{
          updateDegree: Prisma.DegreeGetPayload<{ include: { school: true } }>;
        }>({
          mutation: gql`
            mutation UpdateDegree($updateDegreeInput: UpdateDegreeInput!) {
              updateDegree(updateDegreeInput: $updateDegreeInput) {
                id
                name
              }
            }
          `,
          variables: {
            updateDegreeInput: { ...request, id: this.data()!.degree!.id },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Nivel actualizado exitosamente');
            this.closeModal.emit();
          },
          error: (err) => {
            this.toasts.showError(err.message);
          },
        });
      return;
    }

    this.apollo
      .mutate<{
        createDegree: Prisma.DegreeGetPayload<{ include: { school: true } }>;
      }>({
        mutation: gql`
          mutation CreateDegree($createDegreeInput: CreateDegreeInput!) {
            createDegree(createDegreeInput: $createDegreeInput) {
              id
              name
            }
          }
        `,
        variables: {
          createDegreeInput: { ...request },
        },
      })
      .subscribe({
        next: () => {
          this.toasts.showSuccess('Nivel guardado exitosamente');
          this.closeModal.emit();
        },
        error: (err) => {
          this.toasts.showError(err.message);
        },
      });
  }
}
