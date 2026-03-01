import { Toast } from '@/ui';
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
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
const CREATE_SCHOOL = gql`
  mutation CreateSchool($createSchoolInput: CreateSchoolInput!) {
    createSchool(createSchoolInput: $createSchoolInput) {
      id
      name
      shortName
      organization {
        id
        name
      }
      logo
      address
      city
      state
      zip
      country
      email
      phone
      website
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SCHOOL = gql`
  mutation UpdateSchool($updateSchoolInput: UpdateSchoolInput!) {
    updateSchool(updateSchoolInput: $updateSchoolInput) {
      id
      name
      shortName
      organization {
        id
        name
      }
      logo
      address
      city
      state
      zip
      country
      email
      phone
      website
      createdAt
      updatedAt
    }
  }
`;

@Component({
  selector: 'app-schools-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input
          type="text"
          id="name"
          class="input input-primary"
          formControlName="name"
        />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input
          type="text"
          id="shortName"
          class="input input-primary"
          formControlName="shortName"
        />
      </div>
      <div class="fieldset">
        <label for="organizationId">Organización</label>
        <select
          id="organizationId"
          class="select select-primary"
          formControlName="organizationId"
        >
          <option disabled selected value="">
            --Seleccionar Organización--
          </option>
          @for(organization of organizations.value(); track organization.id) {
          <option [value]="organization.id">
            {{ organization.name }}
          </option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="currentYear">Año actual</label>
        <input
          type="number"
          id="currentYear"
          class="input input-primary"
          formControlName="currentYear"
        />
      </div>
      <div class="fieldset">
        <label for="address">Dirección</label>
        <input
          type="text"
          id="address"
          class="input input-primary"
          formControlName="address"
        />
      </div>
      <div class="fieldset">
        <label for="city">Ciudad</label>
        <input
          type="text"
          id="city"
          class="input input-primary"
          formControlName="city"
        />
      </div>
      <div class="fieldset">
        <label for="state">Estado</label>
        <input
          type="text"
          id="state"
          class="input input-primary"
          formControlName="state"
        />
      </div>
      <div class="fieldset">
        <label for="zip">Código postal</label>
        <input
          type="text"
          id="zip"
          class="input input-primary"
          formControlName="zip"
        />
      </div>
      <div class="fieldset">
        <label for="country">País</label>
        <input
          type="text"
          id="country"
          class="input input-primary"
          formControlName="country"
        />
      </div>
      <div class="fieldset">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          class="input input-primary"
          formControlName="email"
        />
      </div>
      <div class="fieldset">
        <label for="phone">Teléfono</label>
        <input
          type="tel"
          id="phone"
          class="input input-primary"
          formControlName="phone"
        />
      </div>
      <div class="fieldset">
        <label for="website">Sitio web</label>
        <input
          type="url"
          id="website"
          class="input input-primary"
          formControlName="website"
        />
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolsForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  public data = input<{ school?: Prisma.SchoolCreateInput }>();
  private apollo = inject(Apollo);
  public closeModal = output<void>();

  private toasts = inject(Toast);
  public organizations = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ organizations: Prisma.OrganizationCreateInput[] }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetOrganizations {
              organizations {
                id
                name
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data?.organizations ?? [])),
  });

  public form = this.fb.group({
    name: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    organizationId: ['', [Validators.required]],
    logo: ['', []],
    address: ['', []],
    city: ['', []],
    state: ['', []],
    zip: ['', []],
    country: ['', []],
    email: ['', []],
    phone: ['', []],
    website: ['', []],
    currentYear: [2025, [Validators.required]],
  });

  public ngOnInit() {
    if (this.data()?.school) {
      this.form.patchValue(this.data()!.school!);
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      console.log(this.form.errors);
      return;
    }

    if (this.data()?.school) {
      this.apollo
        .mutate<{ updateSchool: Prisma.SchoolCreateInput }>({
          mutation: UPDATE_SCHOOL,
          variables: {
            updateSchoolInput: {
              ...this.form.value,
              id: this.data()!.school!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Escuela actualizada exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toasts.showError('Error al actualizar la escuela');
            console.error(error);
          },
        });
    } else {
      this.apollo
        .mutate<{ createSchool: Prisma.SchoolCreateInput }>({
          mutation: CREATE_SCHOOL,
          variables: {
            createSchoolInput: {
              ...this.form.value,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Escuela creada exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toasts.showError('Error al crear la escuela');
            console.error(error);
          },
        });
    }
    this.closeModal.emit();
  }
}
