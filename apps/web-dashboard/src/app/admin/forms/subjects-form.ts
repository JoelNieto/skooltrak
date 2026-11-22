import { Button, Icon, Toast, UiField, UiInput } from '#/ui';
import { DEFAULT_SUBJECT_ICON, SUBJECT_ICONS } from '@/shared';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-subjects-form',
  imports: [UiField, UiInput, Button, FormField, Icon],
  template: `<form (submit)="onSubmit($event)" novalidate="novalidate">
    <div class="flex flex-col gap-2">
      <ui-field label="Nombre" [field]="form.name">
        <input uiInput type="text" id="name" [formField]="form.name" />
      </ui-field>
      <ui-field label="Código" [field]="form.code">
        <input uiInput type="text" id="code" [formField]="form.code" />
      </ui-field>
      <ui-field
        label="Área"
        [field]="form.area"
        optional
        hint="Agrupa las asignaturas en Mis cursos, por ejemplo Ciencias o Humanidades."
      >
        <input uiInput type="text" id="area" [formField]="form.area" />
      </ui-field>
      <fieldset class="subject-icon-picker flex flex-col gap-2">
        <legend class="mb-1 text-sm font-medium text-ink-strong">Ícono</legend>
        <div class="grid grid-cols-7 gap-1">
          @for (i of icons; track i.name) {
            <label class="relative flex size-11 cursor-pointer items-center justify-center" [title]="i.label">
              <input
                type="radio"
                name="subject-icon"
                class="peer sr-only"
                [value]="i.name"
                [checked]="selectedIcon() === i.name"
                (change)="setIcon(i.name)"
                [attr.aria-label]="i.label"
              />
              <span
                class="flex size-10 items-center justify-center rounded-lg border border-line text-ink peer-checked:border-action peer-checked:bg-action-subtle peer-checked:text-action peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action"
              >
                <ui-icon [name]="i.name" class="text-xl" />
              </span>
            </label>
          }
        </div>
        <p class="text-xs text-ink-muted">Se muestra en la portada de cada curso de esta asignatura.</p>
      </fieldset>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" (click)="closeModal.emit()" type="button">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class SubjectsForm {
  public closeModal = output<void>();
  public data = input<{ subject?: Prisma.SubjectGetPayload<false> }>();
  private toast = inject(Toast);
  #http = inject(HttpClient);
  #subject = signal<{ name: string; code: string; icon: string | null; area: string }>({
    name: '',
    code: '',
    icon: null,
    area: '',
  });
  protected readonly icons = SUBJECT_ICONS;
  /** No icon saved shows the default, so the picker marks it too. */
  protected selectedIcon = () => this.#subject().icon ?? DEFAULT_SUBJECT_ICON;

  protected setIcon(icon: string) {
    this.#subject.update((subject) => ({ ...subject, icon }));
  }
  public form = form(this.#subject, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      const subject = this.data()?.subject;
      if (subject) {
        this.#subject.set({
          name: subject.name,
          code: subject.code,
          icon: subject.icon,
          area: subject.area ?? '',
        });
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toast.showError('Datos inválidos');
    }
    this.form.name().markAsDirty();
    this.form.code().markAsDirty();
    submit(this.form, async () => {
      const subject = this.form().value();
      const subjectId = this.data()?.subject?.id ?? '';

      if (this.data()?.subject) {
        this.#http
          .patch('/api/v1/subjects', {
            ...subject,
            id: subjectId,
          })
          .subscribe({
            next: () => {
              this.toast.showSuccess('Asignatura actualizada');
              this.closeModal.emit();
            },
            error: (error) => {
              this.toast.showError(error.message);
            },
          });
      } else {
        this.#http.post('/api/v1/subjects', subject).subscribe({
          next: () => {
            this.toast.showSuccess('Asignatura creada');
            this.closeModal.emit();
          },
          error: (error) => {
            this.toast.showError(error.message);
          },
        });
      }
    });
  }
}
