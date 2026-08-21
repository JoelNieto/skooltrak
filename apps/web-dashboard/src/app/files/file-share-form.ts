import { Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { forkJoin } from 'rxjs';
import Store from '../core/store';

type ShareTargets = {
  COURSE: { ids: string[]; labels: Record<string, string> };
  CLASS_GROUP: { ids: string[]; labels: Record<string, string> };
  SCHOOL: { ids: string[]; labels: Record<string, string> };
  USER: { ids: string[]; labels: Record<string, string> };
};

interface FileShareFormData {
  targetType: 'COURSE' | 'CLASS_GROUP' | 'SCHOOL' | 'USER';
  targetId: string;
  courseId: string;
  permission: 'VIEW' | 'EDIT';
}

@Component({
  selector: 'app-file-share-form',
  imports: [FormField],
  template: `<form (submit)="onSubmit($event)">
    <div class="flex flex-col gap-4">
      <div class="fieldset">
        <label for="targetType">Compartir con</label>
        <select id="targetType" [formField]="form.targetType" class="select select-primary w-full">
          <option value="COURSE">Curso</option>
          <option value="CLASS_GROUP">Grupo</option>
          <option value="SCHOOL">Escuela</option>
          <option value="USER">Usuario</option>
        </select>
      </div>
      <div class="fieldset">
        <label for="targetId">IDs de destino</label>
        @if (form.targetType().value() === 'COURSE') {
          <div class="flex flex-col sm:flex-row gap-2">
            <select id="courseId" [formField]="form.courseId" class="select select-primary w-full sm:flex-1">
              <option value="" disabled selected>Seleccionar curso</option>
              @for (course of coursesResource.value(); track course.id) {
                <option [value]="course.id">{{ course.name }}</option>
              }
            </select>
            <button class="btn btn-secondary w-full sm:w-auto" type="button" (click)="addTarget()">Agregar</button>
          </div>
        } @else {
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              id="targetId"
              type="text"
              class="input input-primary w-full sm:flex-1"
              [formField]="form.targetId"
              placeholder="Pega un ID y agrega"
            />
            <button class="btn btn-secondary w-full sm:w-auto" type="button" (click)="addTarget()">Agregar</button>
          </div>
        }
        @if (targetIds().length > 0) {
          <div class="mt-2 flex flex-wrap gap-2">
            @for (id of targetIds(); track id) {
              <span class="badge badge-outline gap-2">
                {{ targetLabel(id) }}
                <button type="button" class="text-xs" (click)="removeTarget(id)">✕</button>
              </span>
            }
          </div>
        }
      </div>
      <div class="fieldset">
        <label for="permission">Permiso</label>
        <select id="permission" [formField]="form.permission" class="select select-primary w-full">
          <option value="VIEW">Solo ver</option>
          <option value="EDIT">Puede editar</option>
        </select>
      </div>
    </div>
    <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      <button class="btn btn-ghost w-full sm:w-auto" type="button" (click)="closeModal.emit(undefined)">
        Cancelar
      </button>
      <button class="btn btn-primary w-full sm:w-auto" type="submit">Compartir</button>
    </div>
  </form>`,
})
export default class FileShareForm {
  public data = input.required<{ fileId: string; shareTargets?: ShareTargets }>();
  public closeModal = output<{ shared: boolean } | undefined>();
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private store = inject(Store);

  private fileShareModel = signal<FileShareFormData>({
    targetType: 'COURSE',
    targetId: '',
    courseId: '',
    permission: 'VIEW',
  });

  public form = form(this.fileShareModel, (schemaPath) => {
    required(schemaPath.targetType, { message: 'El tipo de destino es requerido' });
    required(schemaPath.permission, { message: 'El permiso es requerido' });
  });

  public targetIds = signal<string[]>([]);
  public removedTargetIds = signal<string[]>([]);
  public hasTargets = computed(() => this.targetIds().length > 0);

  public coursesResource = httpResource<Array<{ id: string; name: string }>>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) {
        return undefined;
      }
      return `/api/v1/courses/by-school/${schoolId}`;
    },
    { defaultValue: [] },
  );

  constructor() {
    effect(() => {
      const targetType = this.form.targetType().value();
      const existingTargets = this.data().shareTargets?.[targetType]?.ids ?? [];
      this.targetIds.set(existingTargets);
      this.removedTargetIds.set([]);

      this.form.targetId().value.set('');
      this.form.courseId().value.set('');
    });

    afterRenderEffect(() => {
      const initialTargetType = this.form.targetType().value();
      const initialTargets = this.data().shareTargets?.[initialTargetType]?.ids ?? [];
      this.targetIds.set(initialTargets);
      this.removedTargetIds.set([]);
    });
  }

  addTarget() {
    const formValue = this.form().value();
    const targetId = formValue.targetType === 'COURSE' ? (formValue.courseId?.trim() ?? '') : formValue.targetId.trim();

    if (!targetId) {
      this.toast.showError('Ingresa un ID válido.');
      return;
    }
    this.targetIds.update((current) => {
      if (current.includes(targetId)) {
        return current;
      }
      return [...current, targetId];
    });
    this.removedTargetIds.update((current) => current.filter((id) => id !== targetId));
    this.form.targetId().value.set('');
    this.form.courseId().value.set('');
  }

  removeTarget(targetId: string) {
    this.targetIds.update((current) => current.filter((id) => id !== targetId));
    const initialTargets = this.data().shareTargets?.[this.form.targetType().value()]?.ids ?? [];
    if (initialTargets.includes(targetId)) {
      this.removedTargetIds.update((current) => {
        if (current.includes(targetId)) {
          return current;
        }
        return [...current, targetId];
      });
    }
  }

  targetLabel(id: string) {
    const targetType = this.form.targetType().value();
    const labels = this.data().shareTargets?.[targetType]?.labels ?? {};
    if (labels[id]) {
      return labels[id];
    }
    if (targetType !== 'COURSE') {
      return id;
    }
    const course = this.coursesResource.value()?.find((item) => item.id === id);
    return course?.name ?? id;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.hasTargets()) {
      this.toast.showError('Agrega al menos un ID.');
      return;
    }

    if (this.form().invalid()) {
      this.toast.showError('Formulario invalido');
      return;
    }

    const { targetType, permission } = this.form().value();
    const fileId = this.data().fileId;
    const initialTargets = this.data().shareTargets?.[targetType]?.ids ?? [];
    const currentTargets = this.targetIds();
    const removedTargets = this.removedTargetIds();
    const newTargets = currentTargets.filter((targetId) => !initialTargets.includes(targetId));

    const shareMutations = newTargets.map((targetId) =>
      this.http.post('/api/v1/files/share', {
        fileId,
        targetType,
        targetId,
        permission,
      }),
    );

    const removeMutations = removedTargets.map((targetId) =>
      this.http.post('/api/v1/files/share/remove', {
        fileId,
        targetType,
        targetId,
      }),
    );

    const mutations = [...shareMutations, ...removeMutations];
    if (mutations.length === 0) {
      this.toast.showError('No hay cambios para guardar.');
      return;
    }

    forkJoin(mutations).subscribe({
      next: () => {
        this.toast.showSuccess('Cambios guardados correctamente');
        this.closeModal.emit({ shared: true });
      },
      error: () => {
        this.toast.showError('Error al actualizar los accesos');
      },
    });
  }
}
