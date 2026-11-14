import { Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-schools-form',
  imports: [UiField, UiInput, UiSelect, Button, FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Nombre corto" [field]="form.shortName">
        <input uiInput type="text" id="shortName" [formField]="form.shortName" />
      </ui-field>
      <ui-field label="Organización" [field]="form.organizationId">
        <select uiSelect id="organizationId" [formField]="form.organizationId">
          <option disabled selected value="">--Seleccionar Organización--</option>
          @for (organization of organizations.value(); track organization.id) {
            <option [value]="organization.id">
              {{ organization.name }}
            </option>
          }
        </select>
      </ui-field>
      <ui-field label="Año actual" [field]="form.currentYear">
        <input uiInput type="number" id="currentYear" [formField]="form.currentYear" />
      </ui-field>
      <ui-field label="Dirección" [field]="form.address">
        <input uiInput type="text" id="address" [formField]="form.address" />
      </ui-field>
      <ui-field label="Ciudad" [field]="form.city">
        <input uiInput type="text" id="city" [formField]="form.city" />
      </ui-field>
      <ui-field label="Estado" [field]="form.state">
        <input uiInput type="text" id="state" [formField]="form.state" />
      </ui-field>
      <ui-field label="Código postal" [field]="form.zip">
        <input uiInput type="text" id="zip" [formField]="form.zip" />
      </ui-field>
      <ui-field label="País" [field]="form.country">
        <input uiInput type="text" id="country" [formField]="form.country" />
      </ui-field>
      <ui-field label="Email" [field]="form.email">
        <input uiInput type="email" id="email" [formField]="form.email" />
      </ui-field>
      <ui-field label="Teléfono" [field]="form.phone">
        <input uiInput type="tel" id="phone" [formField]="form.phone" />
      </ui-field>
      <ui-field label="Sitio web" [field]="form.website">
        <input uiInput type="url" id="website" [formField]="form.website" />
      </ui-field>
    </div>
    <div class="flex justify-end mt-4">
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export class SchoolsForm {
  public data = input<{ school?: Prisma.SchoolCreateInput }>();
  private http = inject(HttpClient);
  public closeModal = output<void>();
  private school = computed(() => this.data()?.school);
  private toasts = inject(Toast);
  public organizations = httpResource<Array<{ id: string; name: string }>>(() => '/api/v1/organizations', {
    defaultValue: [],
  });

  private formModel = signal({
    name: '',
    shortName: '',
    organizationId: '',
    logo: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    email: '',
    phone: '',
    website: '',
    currentYear: 2025,
  });

  public form = form(this.formModel, (schemaPath) => {
    required(schemaPath.name);
    required(schemaPath.organizationId);
    required(schemaPath.shortName);
    required(schemaPath.currentYear);
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.school()) {
        this.formModel.update((initial) => ({ ...initial, ...this.school()! }));
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
    if (this.data()?.school) {
      void firstValueFrom(
        this.http.patch('/api/v1/schools', {
          ...body,
          id: this.school()!.id!,
        }),
      )
        .then(() => {
          this.toasts.showSuccess('Escuela actualizada exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al actualizar la escuela');
          console.error(error);
        });
    } else {
      void firstValueFrom(this.http.post('/api/v1/schools', body))
        .then(() => {
          this.toasts.showSuccess('Escuela creada exitosamente');
          this.closeModal.emit();
        })
        .catch((error) => {
          this.toasts.showError('Error al crear la escuela');
          console.error(error);
        });
    }
  }
}
