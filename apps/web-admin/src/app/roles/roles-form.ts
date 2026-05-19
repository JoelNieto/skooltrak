import { Toast } from '#/ui';
import { Component, inject, input, model, OnInit, output } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-roles-form',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="createRole()">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input id="name" formControlName="name" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="description">Descripción</label>
        <input
          id="description"
          formControlName="description"
          class="input input-primary"
        />
      </div>
      <div class="fieldset">
        <label for="organizationId">Organización</label>
        <select
          id="organizationId"
          formControlName="organizationId"
          class="select select-primary"
        >
          <option [value]="null">Seleccionar Organización</option>
          @for (organization of organizations.value(); track organization.id) {
          <option [value]="organization.id">
            {{ organization.name }}
          </option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="permissionIds">Permisos</label>
        @for (permission of permissions.value(); track permission.id) {
        <label class="label flex gap-2 items-center">
          <input
            type="checkbox"
            class="toggle toggle-primary"
            [checked]="selectedIds().includes(permission.id!)"
            [id]="permission.id"
            (change)="togglePermission(permission.id!)"
          />
          <span class="label-text ml-2"
            >{{ permission.description }} {{ permission.descriptiveId }}</span
          >
        </label>
        }
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `,
})
export class RolesForm implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(NonNullableFormBuilder);
  private toast = inject(Toast);
  public closeModal = output<void>();
  public data = input<{
    role?: Prisma.RoleGetPayload<{
      include: { organization: true; permissions: true };
    }>;
  }>();
  public permissions = httpResource<Array<{ id: string; descriptiveId: string; description: string }>>(
    () => ({
      url: '/api/v1/permissions',
      params: { take: '500' },
    }),
    { defaultValue: [] },
  );

  public organizations = httpResource<Array<{ id: string; name: string }>>(
    () => '/api/v1/organizations',
    { defaultValue: [] },
  );

  public selectedIds = model<string[]>([]);

  public form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    organizationId: this.fb.control<string | null>(null, []),
    permissionIds: this.fb.control<string[]>([], []),
  });

  ngOnInit() {
    if (this.data()?.role) {
      this.form.patchValue(this.data()!.role!);
      this.selectedIds.set(this.data()!.role!.permissions.map((p) => p.id));
    }
  }

  togglePermission(id: string) {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((id) => id !== id) : [...ids, id]
    );
  }

  public createRole() {
    if (this.form.invalid) {
      this.toast.showError('Formulario inválido');
      return;
    }
    this.form.patchValue({
      permissionIds: this.selectedIds(),
    });

    const req = this.form.getRawValue();

    if (this.data()?.role) {
      void firstValueFrom(
        this.http.patch('/api/v1/roles', { ...req, id: this.data()!.role!.id }),
      )
        .then(() => {
          this.toast.showSuccess('Rol actualizado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar el rol');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/roles', req))
        .then(() => {
          this.toast.showSuccess('Rol creado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al crear el rol');
          console.error(error);
        });
    }
  }
}
