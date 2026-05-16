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
import { Prisma } from '@generated/prisma';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organizations-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="flex flex-col gap-4">
        <div class="fieldset">
          <label for="name">Nombre</label>
          <input
            type="text"
            class="input input-primary"
            id="name"
            formControlName="name"
          />
        </div>
        <div class="fieldset">
          <label for="description">Descripción</label>
          <input
            type="text"
            class="input input-primary"
            id="description"
            formControlName="description"
          />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" class="btn btn-neutral">Guardar</button>
      </div>
    </form>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationsForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  public data = input<{ organization?: Prisma.OrganizationCreateInput }>();
  private http = inject(HttpClient);
  public closeModal = output<void>();
  private toasts = inject(Toast);
  public form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  public ngOnInit() {
    if (this.data()?.organization) {
      this.form.patchValue(this.data()!.organization!);
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Formulario inválido');
      return;
    }

    const req = this.form.getRawValue();
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
