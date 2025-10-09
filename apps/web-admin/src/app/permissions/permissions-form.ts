import { Toast } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';

const CREATE_PERMISSION = gql`
  mutation CreatePermission($createPermissionInput: CreatePermissionInput!) {
    createPermission(createPermissionInput: $createPermissionInput) {
      id
      descriptiveId
      description
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PERMISSION = gql`
  mutation UpdatePermission($updatePermissionInput: UpdatePermissionInput!) {
    updatePermission(updatePermissionInput: $updatePermissionInput) {
      id
      descriptiveId
      description
      createdAt
      updatedAt
    }
  }
`;

@Component({
  selector: 'app-permissions-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="fieldset">
      <label for="description">Descripción</label>
      <input
        id="description"
        formControlName="description"
        class="input input-primary"
      />
    </div>
    <div class="fieldset">
      <label for="descriptiveId">ID Descriptivo</label>
      <input
        id="descriptiveId"
        formControlName="descriptiveId"
        class="input input-primary"
      />
    </div>
    <div class="flex justify-end mt-4">
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  public closeModal = output<void>();
  public data = input<{ permission?: Prisma.PermissionGetPayload<false> }>();
  private toast = inject(Toast);
  private apollo = inject(Apollo);

  public form = this.fb.group({
    descriptiveId: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  public ngOnInit() {
    if (this.data()?.permission) {
      this.form.patchValue(this.data()!.permission!);
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.toast.showError('Formulario inválido');
      return;
    }

    const req = this.form.getRawValue();
    if (this.data()?.permission) {
      this.apollo
        .mutate<{ updatePermission: Prisma.PermissionGetPayload<false> }>({
          mutation: UPDATE_PERMISSION,
          variables: {
            updatePermissionInput: {
              ...req,
              id: this.data()!.permission!.id,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Permiso actualizado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError('Error al actualizar el permiso');
            console.error(error);
          },
        });
    } else {
      this.apollo
        .mutate<{ createPermission: Prisma.PermissionGetPayload<false> }>({
          mutation: CREATE_PERMISSION,
          variables: {
            createPermissionInput: {
              ...req,
            },
          },
        })
        .subscribe({
          next: () => {
            this.toast.showSuccess('Permiso creado exitosamente');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError('Error al crear el permiso');
            console.error(error);
          },
        });
    }
  }
}
