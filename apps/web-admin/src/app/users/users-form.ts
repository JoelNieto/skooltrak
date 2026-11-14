import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-users-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ui-field label="Nombre" [field]="form.firstName">
        <input uiInput type="text" [formField]="form.firstName" id="firstName" />
      </ui-field>
      <ui-field label="Apellido" [field]="form.lastName">
        <input uiInput type="text" [formField]="form.lastName" id="lastName" />
      </ui-field>
      <ui-field label="Email" [field]="form.email">
        <input uiInput type="email" [formField]="form.email" id="email" />
      </ui-field>
      <ui-field label="Rol" [field]="form.roleId">
        <select uiSelect [formField]="form.roleId" id="roleId">
          @for (role of roles.value(); track role.id) {
            <option [value]="role.id">{{ role.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Organización" [field]="form.organizationId">
        <select uiSelect [formField]="form.organizationId" id="organizationId">
          @for (organization of organizations.value(); track organization.id) {
            <option [value]="organization.id">
              {{ organization.name }}
            </option>
          }
        </select>
      </ui-field>
      <ui-field label="Password" [field]="form.password">
        <input uiInput type="password" [formField]="form.password" id="password" />
      </ui-field>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" (click)="closeModal.emit()">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
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
