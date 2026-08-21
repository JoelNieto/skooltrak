import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-permissions-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="fieldset">
      <label for="description">Descripción</label>
      <input id="description" [formField]="form.description" class="input input-primary" />
    </div>
    <div class="fieldset">
      <label for="descriptiveId">ID Descriptivo</label>
      <input id="descriptiveId" [formField]="form.descriptiveId" class="input input-primary" />
    </div>
    <div class="flex justify-end mt-4">
      <button class="btn btn-neutral" type="submit">Guardar</button>
    </div>
  </form>`,
})
export class PermissionsForm {
  public closeModal = output<void>();
  public data = input<{ permission?: Prisma.PermissionGetPayload<false> }>();
  private toast = inject(Toast);
  private http = inject(HttpClient);

  private formModel = signal({
    descriptiveId: '',
    description: '',
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.description);
    required(schemaPath.descriptiveId);
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.data()?.permission) {
        this.formModel.set(this.data()!.permission!);
      }
    });
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Formulario inválido');
      return;
    }

    const req = this.formModel();
    if (this.data()?.permission) {
      void firstValueFrom(this.http.patch('/api/v1/permissions', { ...req, id: this.data()!.permission!.id! }))
        .then(() => {
          this.toast.showSuccess('Permiso actualizado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al actualizar el permiso');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/permissions', req))
        .then(() => {
          this.toast.showSuccess('Permiso creado exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toast.showError('Error al crear el permiso');
          console.error(error);
        });
    }
  }
}
