import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-users-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="fieldset">
        <label for="firstName">Nombre</label>
        <input type="text" class="input input-primary" [formField]="form.firstName" id="firstName" />
      </div>
      <div class="fieldset">
        <label for="lastName">Apellido</label>
        <input type="text" class="input input-primary" [formField]="form.lastName" id="lastName" />
      </div>
      <div class="fieldset">
        <label for="email">Email</label>
        <input type="email" class="input input-primary" [formField]="form.email" id="email" />
      </div>
      <div class="fieldset">
        <label for="role">Rol</label>
        <select class="select select-primary" [formField]="form.roleId" id="roleId">
          @for (role of roles.value(); track role.id) {
            <option [value]="role.id">{{ role.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="organizationId">Organización</label>
        <select class="select select-primary" [formField]="form.organizationId" id="organizationId">
          @for (organization of organizations.value(); track organization.id) {
            <option [value]="organization.id">
              {{ organization.name }}
            </option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="password">Password</label>
        <input type="password" class="input input-primary" [formField]="form.password" id="password" />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
})
export class UsersForm {
  public data = input<{ user?: Prisma.UserCreateInput }>();
  public closeModal = output<void>();
  private http = inject(HttpClient);
  private toasts = inject(Toast);

  public roles = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/roles', {
    defaultValue: [],
  });

  public organizations = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/organizations', {
    defaultValue: [],
  });

  private formModel = signal({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    password: '',
    organizationId: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Nombre requerido' });
    required(schemaPath.lastName, { message: 'Apellido requerido' });
    required(schemaPath.email, { message: 'Email requerido' });
    required(schemaPath.roleId, { message: 'Rol requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.user) {
        this.formModel.update((initial) => ({ ...initial, ...this.data()!.user! }));
      }
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      console.log(this.form().errors());
      return;
    }

    const body = this.formModel();
    if (this.data()?.user) {
      void firstValueFrom(this.http.patch('/api/v1/users', { ...body, id: this.data()!.user!.id! }))
        .then(() => {
          this.toasts.showSuccess('Usuario actualizado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al actualizar el usuario');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/users', body))
        .then(() => {
          this.toasts.showSuccess('Usuario creado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al crear el usuario');
          console.error(error);
        });
    }
  }
}
