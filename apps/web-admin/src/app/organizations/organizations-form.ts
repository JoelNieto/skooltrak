import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organizations-form',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="flex flex-col gap-4">
        <div class="fieldset">
          <label for="name">Nombre</label>
          <input type="text" class="input input-primary" id="name" [formField]="form.name" />
        </div>
        <div class="fieldset">
          <label for="description">Descripción</label>
          <input type="text" class="input input-primary" id="description" [formField]="form.description" />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" class="btn btn-neutral">Guardar</button>
      </div>
    </form>
  `,
})
export class OrganizationsForm {
  public data = input<{ organization?: Prisma.OrganizationCreateInput }>();
  private http = inject(HttpClient);
  public closeModal = output<void>();
  private toasts = inject(Toast);
  public formModel = signal({ name: '', description: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.description, { message: 'Descripcion requerida' });
  });

  constructor() {
    afterRenderEffect(() => {
      const organization = this.data()?.organization;
      if (organization) {
        this.formModel.set(organization);
      }
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Formulario inválido');
      return;
    }

    const req = this.formModel();
    if (this.data()?.organization) {
      void firstValueFrom(
        this.http.patch('/api/v1/organizations', {
          ...req,
          id: this.data()!.organization!.id!,
        }),
      )
        .then(() => {
          this.toasts.showSuccess('Organización actualizada exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al actualizar la organización');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/organizations', req))
        .then(() => {
          this.toasts.showSuccess('Organización creada exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al crear la organización');
          console.error(error);
        });
    }
  }
}
