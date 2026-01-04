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
const CREATE_USER = gql`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
      firstName
      lastName
      email
      role {
        id
        name
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      firstName
      lastName
      email
      role {
        id
        name
      }
    }
  }
`;

@Component({
  selector: 'app-users-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="fieldset">
        <label for="firstName">Nombre</label>
        <input
          type="text"
          class="input input-primary"
          formControlName="firstName"
          id="firstName"
        />
      </div>
      <div class="fieldset">
        <label for="lastName">Apellido</label>
        <input
          type="text"
          class="input input-primary"
          formControlName="lastName"
          id="lastName"
        />
      </div>
      <div class="fieldset">
        <label for="email">Email</label>
        <input
          type="email"
          class="input input-primary"
          formControlName="email"
          id="email"
        />
      </div>
      <div class="fieldset">
        <label for="role">Rol</label>
        <select
          class="select select-primary"
          formControlName="roleId"
          id="roleId"
        >
          @for (role of roles.value(); track role.id) {
          <option [value]="role.id">{{ role.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="organizationId">Organización</label>
        <select
          class="select select-primary"
          formControlName="organizationId"
          id="organizationId"
        >
          @for (organization of organizations.value(); track organization.id) {
          <option [value]="organization.id">
            {{ organization.name }}
          </option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="password">Password</label>
        <input
          type="password"
          class="input input-primary"
          formControlName="password"
          id="password"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()">
        Cancelar
      </button>
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersForm implements OnInit {
  public data = input<{ user?: Prisma.UserCreateInput }>();
  public closeModal = output<void>();
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toasts = inject(Toast);

  public roles = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ roles: Prisma.RoleGetPayload<true>[] }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetRoles {
              roles {
                id
                name
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.roles)),
  });

  public organizations = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ organizations: Prisma.OrganizationGetPayload<true>[] }>({
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
        .valueChanges.pipe(map((result) => result.data.organizations)),
  });

  public form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required]],
    roleId: ['', [Validators.required]],
    password: ['', []],
    organizationId: ['', []],
  });

  public ngOnInit() {
    if (this.data()?.user) {
      this.form.patchValue(this.data()!.user!);
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      console.log(this.form.errors);
      return;
    }

    if (this.data()?.user) {
      this.apollo
        .mutate<{ updateUser: Prisma.UserCreateInput }>({
          mutation: UPDATE_USER,
          variables: {
            updateUserInput: {
              ...this.form.value,
              id: this.data()!.user!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Usuario actualizado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toasts.showError('Error al actualizar el usuario');
            console.error(error);
          },
        });
    } else {
      this.apollo
        .mutate<{ createUser: Prisma.UserCreateInput }>({
          mutation: CREATE_USER,
          variables: {
            createUserInput: {
              ...this.form.value,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toasts.showSuccess('Usuario creado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toasts.showError('Error al crear el usuario');
            console.error(error);
          },
        });
    }
  }
}
