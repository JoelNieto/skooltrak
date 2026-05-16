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
      <button class="btn btn-neutral" type="submit">Guardar</button>
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
  private http = inject(HttpClient);

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
      void firstValueFrom(
        this.http.patch('/api/v1/permissions', { ...req, id: this.data()!.permission!.id! }),
      )
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
