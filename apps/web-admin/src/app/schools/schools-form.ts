import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';
import { computed } from 'node_modules/@angular/aria/types/_collection-chunk';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-schools-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="fieldset">
        <label for="name">Nombre</label>
        <input type="text" id="name" class="input input-primary" [formField]="form.name" />
      </div>
      <div class="fieldset">
        <label for="shortName">Nombre corto</label>
        <input type="text" id="shortName" class="input input-primary" [formField]="form.shortName" />
      </div>
      <div class="fieldset">
        <label for="organizationId">Organización</label>
        <select id="organizationId" class="select select-primary" [formField]="form.organizationId">
          <option disabled selected value="">--Seleccionar Organización--</option>
          @for (organization of organizations.value(); track organization.id) {
            <option [value]="organization.id">
              {{ organization.name }}
            </option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="currentYear">Año actual</label>
        <input type="number" id="currentYear" class="input input-primary" [formField]="form.currentYear" />
      </div>
      <div class="fieldset">
        <label for="address">Dirección</label>
        <input type="text" id="address" class="input input-primary" [formField]="form.address" />
      </div>
      <div class="fieldset">
        <label for="city">Ciudad</label>
        <input type="text" id="city" class="input input-primary" [formField]="form.city" />
      </div>
      <div class="fieldset">
        <label for="state">Estado</label>
        <input type="text" id="state" class="input input-primary" [formField]="form.state" />
      </div>
      <div class="fieldset">
        <label for="zip">Código postal</label>
        <input type="text" id="zip" class="input input-primary" [formField]="form.zip" />
      </div>
      <div class="fieldset">
        <label for="country">País</label>
        <input type="text" id="country" class="input input-primary" [formField]="form.country" />
      </div>
      <div class="fieldset">
        <label for="email">Email</label>
        <input type="email" id="email" class="input input-primary" [formField]="form.email" />
      </div>
      <div class="fieldset">
        <label for="phone">Teléfono</label>
        <input type="tel" id="phone" class="input input-primary" [formField]="form.phone" />
      </div>
      <div class="fieldset">
        <label for="website">Sitio web</label>
        <input type="url" id="website" class="input input-primary" [formField]="form.website" />
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <button class="btn btn-neutral" type="submit">Guardar</button>
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
