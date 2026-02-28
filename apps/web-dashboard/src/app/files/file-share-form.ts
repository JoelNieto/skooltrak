import { markGroupDirty, Toast } from '@/ui';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { forkJoin, map, of } from 'rxjs';
import Store from '../core/store';

type ShareTargets = {
  COURSE: { ids: string[]; labels: Record<string, string> };
  CLASS_GROUP: { ids: string[]; labels: Record<string, string> };
  SCHOOL: { ids: string[]; labels: Record<string, string> };
  USER: { ids: string[]; labels: Record<string, string> };
};

@Component({
  selector: 'app-file-share-form',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="flex flex-col gap-4">
      <div class="fieldset">
        <label for="targetType">Compartir con</label>
        <select
          id="targetType"
          formControlName="targetType"
          class="select select-primary w-full"
        >
          <option value="COURSE">Curso</option>
          <option value="CLASS_GROUP">Grupo</option>
          <option value="SCHOOL">Escuela</option>
          <option value="USER">Usuario</option>
        </select>
      </div>
      <div class="fieldset">
        <label for="targetId">IDs de destino</label>
        @if(targetType() === 'COURSE') {
        <div class="flex flex-col sm:flex-row gap-2">
          <select
            id="courseId"
            formControlName="courseId"
            class="select select-primary w-full sm:flex-1"
          >
            <option value="" disabled selected>Seleccionar curso</option>
            @for(course of coursesResource.value(); track course.id) {
            <option [value]="course.id">{{ course.name }}</option>
            }
          </select>
          <button
            class="btn btn-secondary w-full sm:w-auto"
            type="button"
            (click)="addTarget()"
          >
            Agregar
          </button>
        </div>
        } @else {
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            id="targetId"
            type="text"
            class="input input-primary w-full sm:flex-1"
            formControlName="targetId"
            placeholder="Pega un ID y agrega"
          />
          <button
            class="btn btn-secondary w-full sm:w-auto"
            type="button"
            (click)="addTarget()"
          >
            Agregar
          </button>
        </div>
        }
        @if(targetIds().length > 0) {
        <div class="mt-2 flex flex-wrap gap-2">
          @for(id of targetIds(); track id) {
          <span class="badge badge-outline gap-2">
            {{ targetLabel(id) }}
            <button
              type="button"
              class="text-xs"
              (click)="removeTarget(id)"
            >
              ✕
            </button>
          </span>
          }
        </div>
        }
      </div>
      <div class="fieldset">
        <label for="permission">Permiso</label>
        <select
          id="permission"
          formControlName="permission"
          class="select select-primary w-full"
        >
          <option value="VIEW">Solo ver</option>
          <option value="EDIT">Puede editar</option>
        </select>
      </div>
    </div>
    <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      <button
        class="btn btn-ghost w-full sm:w-auto"
        type="button"
        (click)="closeModal.emit(undefined)"
      >
        Cancelar
      </button>
      <button class="btn btn-primary w-full sm:w-auto" type="submit">
        Compartir
      </button>
    </div>
  </form>`,
})
export default class FileShareForm implements OnInit {
  public data = input.required<{ fileId: string; shareTargets?: ShareTargets }>();
  public closeModal = output<{ shared: boolean } | undefined>();
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private toast = inject(Toast);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  public form = this.fb.group({
    targetType: this.fb.control<'COURSE' | 'CLASS_GROUP' | 'SCHOOL' | 'USER'>(
      'COURSE',
      [Validators.required]
    ),
    targetId: this.fb.control(''),
    courseId: this.fb.control<string | null>(null),
    permission: this.fb.control<'VIEW' | 'EDIT'>('VIEW', [Validators.required]),
  });
  public targetIds = signal<string[]>([]);
  public removedTargetIds = signal<string[]>([]);
  public hasTargets = computed(() => this.targetIds().length > 0);

  public coursesResource = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          coursesBySchoolId: Array<{ id: string; name: string }>;
        }>({
          query: gql`
            query coursesBySchoolId($schoolId: String!) {
              coursesBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data?.coursesBySchoolId ?? []));
    },
  });

  constructor() {
    this.form
      .get('targetType')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const targetType = this.targetType();
        const existingTargets = this.data().shareTargets?.[targetType]?.ids ?? [];
        this.targetIds.set(existingTargets);
        this.removedTargetIds.set([]);
        this.form.get('targetId')?.setValue('');
        this.form.get('courseId')?.setValue(null);
      });
  }

  ngOnInit() {
    const initialTargetType = this.targetType();
    const initialTargets =
      this.data().shareTargets?.[initialTargetType]?.ids ?? [];
    this.targetIds.set(initialTargets);
    this.removedTargetIds.set([]);
  }

  targetType() {
    return this.form.getRawValue().targetType;
  }

  addTarget() {
    const formValue = this.form.getRawValue();
    const targetId =
      formValue.targetType === 'COURSE'
        ? formValue.courseId?.trim() ?? ''
        : formValue.targetId.trim();

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
    this.removedTargetIds.update((current) =>
      current.filter((id) => id !== targetId)
    );
    this.form.get('targetId')?.setValue('');
    this.form.get('courseId')?.setValue(null);
  }

  removeTarget(targetId: string) {
    this.targetIds.update((current) =>
      current.filter((id) => id !== targetId)
    );
    const initialTargets =
      this.data().shareTargets?.[this.targetType()]?.ids ?? [];
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
    const targetType = this.targetType();
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

  onSubmit() {
    if (!this.hasTargets()) {
      this.toast.showError('Agrega al menos un ID.');
      return;
    }

    if (this.form.invalid) {
      this.toast.showError('Formulario invalido');
      markGroupDirty(this.form);
      return;
    }

    const { targetType, permission } = this.form.getRawValue();
    const fileId = this.data().fileId;
    const initialTargets =
      this.data().shareTargets?.[targetType]?.ids ?? [];
    const currentTargets = this.targetIds();
    const removedTargets = this.removedTargetIds();
    const newTargets = currentTargets.filter(
      (targetId) => !initialTargets.includes(targetId)
    );

    const shareMutations = newTargets.map((targetId) =>
      this.apollo.mutate({
        mutation: gql`
          mutation ShareFile($shareFileInput: ShareFileInput!) {
            shareFile(shareFileInput: $shareFileInput) {
              id
            }
          }
        `,
        variables: {
          shareFileInput: {
            fileId,
            targetType,
            targetId,
            permission,
          },
        },
      })
    );

    const removeMutations = removedTargets.map((targetId) =>
      this.apollo.mutate({
        mutation: gql`
          mutation RemoveShare($removeShareInput: RemoveShareInput!) {
            removeShare(removeShareInput: $removeShareInput) {
              id
            }
          }
        `,
        variables: {
          removeShareInput: {
            fileId,
            targetType,
            targetId,
          },
        },
      })
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
