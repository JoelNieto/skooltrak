import { Button, Toast, UiField, UiInput } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, output, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

/**
 * New organization = organization + invitation to its first administrator (IAM-001 FR .1–.2).
 * Editing an existing organization only changes its name and description.
 */
@Component({
  selector: 'app-organizations-form',
  imports: [UiField, UiInput, Button, FormField],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-6">
      <fieldset class="flex flex-col gap-4">
        @if (!isEdit()) {
          <legend class="type-caption uppercase tracking-wider text-ink-muted mb-2">Organización</legend>
        }
        <ui-field label="Nombre" [field]="form.name">
          <input uiInput type="text" id="name" [formField]="form.name" />
        </ui-field>
        <ui-field label="Descripción" hint="Solo la ve el equipo de plataforma" [field]="form.description">
          <input uiInput type="text" id="description" [formField]="form.description" />
        </ui-field>
      </fieldset>

      @if (!isEdit()) {
        <fieldset class="flex flex-col gap-4">
          <legend class="type-caption uppercase tracking-wider text-ink-muted mb-2">Administrador de la organización</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ui-field label="Nombre" [field]="form.adminFirstName">
              <input uiInput type="text" id="adminFirstName" autocomplete="off" [formField]="form.adminFirstName" />
            </ui-field>
            <ui-field label="Apellido" [field]="form.adminLastName">
              <input uiInput type="text" id="adminLastName" autocomplete="off" [formField]="form.adminLastName" />
            </ui-field>
          </div>
          <ui-field
            label="Correo electrónico"
            hint="Le enviaremos un enlace para crear su acceso. Vence en 7 días."
            [field]="form.adminEmail"
          >
            <input uiInput type="email" id="adminEmail" autocomplete="off" [formField]="form.adminEmail" />
          </ui-field>
        </fieldset>
      }

      <div class="flex justify-end">
        <button uiButton variant="primary" type="submit" [loading]="saving()" [disabled]="saving()">
          {{ isEdit() ? 'Guardar' : 'Crear y enviar invitación' }}
        </button>
      </div>
    </form>
  `,
})
export class OrganizationsForm {
  public data = input<{ organization?: Prisma.OrganizationCreateInput }>();
  private http = inject(HttpClient);
  public closeModal = output<void>();
  private toasts = inject(Toast);

  protected readonly isEdit = computed(() => !!this.data()?.organization);
  protected readonly saving = signal(false);

  public formModel = signal({ name: '', description: '', adminFirstName: '', adminLastName: '', adminEmail: '' });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre requerido' });
    required(schemaPath.adminFirstName, { message: 'Nombre requerido', when: () => !this.isEdit() });
    required(schemaPath.adminLastName, { message: 'Apellido requerido', when: () => !this.isEdit() });
    required(schemaPath.adminEmail, { message: 'Correo requerido', when: () => !this.isEdit() });
    email(schemaPath.adminEmail, { message: 'Correo electrónico inválido' });
  });

  constructor() {
    afterRenderEffect(() => {
      const organization = this.data()?.organization;
      if (organization) {
        this.formModel.update((model) => ({
          ...model,
          name: organization.name,
          description: organization.description ?? '',
        }));
      }
    });
  }

  public async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Formulario inválido');
      return;
    }

    const { name, description, adminFirstName, adminLastName, adminEmail } = this.formModel();
    this.saving.set(true);
    try {
      if (this.isEdit()) {
        const id = this.data()?.organization?.id;
        await firstValueFrom(this.http.patch('/api/v1/organizations', { name, description, id }));
        this.toasts.showSuccess('Organización actualizada exitosamente');
      } else {
        await firstValueFrom(
          this.http.post('/api/v1/organizations/with-invitation', {
            name,
            description,
            admin: { firstName: adminFirstName, lastName: adminLastName, email: adminEmail },
          }),
        );
        this.toasts.showSuccess(`Invitación enviada a ${adminEmail.trim().toLowerCase()}`);
      }
      this.closeModal.emit();
    } catch (error) {
      const message = error instanceof HttpErrorResponse ? error.error?.message : null;
      this.toasts.showError(
        (Array.isArray(message) ? message[0] : message) ??
          (this.isEdit() ? 'Error al actualizar la organización' : 'Error al crear la organización'),
      );
    } finally {
      this.saving.set(false);
    }
  }
}
