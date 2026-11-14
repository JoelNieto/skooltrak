import { Button, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-group-schedule-form',
  imports: [UiCheckbox, UiChoice, UiField, UiInput, UiSelect, Button, FormField],
  template: ` <form (submit)="save($event)" novalidate>
    <div class="flex flex-col md:grid md:grid-cols-2 gap-2">
      <ui-field label="Curso" [field]="form.courseId">
        <select uiSelect [formField]="form.courseId">
          <option value="" disabled>---Seleccionar---</option>
          @for (course of courses.value(); track course.id) {
            <option [value]="course.id">{{ course.name }}</option>
          }
        </select>
      </ui-field>
      <ui-field label="Día de la semana" [field]="form.weekday">
        <select uiSelect [formField]="form.weekday">
          <option value="MONDAY">Lunes</option>
          <option value="TUESDAY">Martes</option>
          <option value="WEDNESDAY">Miércoles</option>
          <option value="THURSDAY">Jueves</option>
          <option value="FRIDAY">Viernes</option>
          <option value="SATURDAY">Sábado</option>
          <option value="SUNDAY">Domingo</option>
        </select>
      </ui-field>
      <ui-field label="Hora de inicio" [field]="form.startTime">
        <input uiInput [formField]="form.startTime" type="time" />
      </ui-field>
      <ui-field label="Hora de fin" [field]="form.endTime">
        <input uiInput [formField]="form.endTime" type="time" />
      </ui-field>
      <ui-field label="Ubicación" [field]="form.location" class="md:col-span-2">
        <input uiInput [formField]="form.location" type="text" />
      </ui-field>
      <ui-choice label="Remoto" [field]="form.remote">
        <input uiCheckbox [formField]="form.remote" type="checkbox" />
      </ui-choice>
      <ui-field label="Enlace remoto" [field]="form.remoteLink">
        <input uiInput [formField]="form.remoteLink" type="text" />
      </ui-field>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
      <button uiButton variant="primary" type="submit">Guardar</button>
    </div>
  </form>`,
})
export default class GroupScheduleForm {
  public closeModal = output<void>();
  public data = input.required<{
    schedule?: Prisma.ClassGroupWeeklyScheduleGetPayload<undefined>;
    groupId: string;
    weekday?: string;
  }>();
  #http = inject(HttpClient);
  #toast = inject(Toast);
  public courses = httpResource<Array<{ id: string; name: string }>>(
    () => `/api/v1/courses/by-group/${this.data().groupId}`,
    { defaultValue: [] },
  );

  #schedule = signal({
    classGroupId: '',
    courseId: '',
    weekday: 'MONDAY',
    location: '',
    remote: false,
    remoteLink: '',
    startTime: '',
    endTime: '',
  });

  public form = form(this.#schedule, (schemaPath) => {
    required(schemaPath.classGroupId, { message: 'Grupo es requerido' });
    required(schemaPath.courseId, { message: 'Curso es requerido' });
    required(schemaPath.weekday, { message: 'Día de la semana es requerido' });
    required(schemaPath.startTime, { message: 'Hora de inicio es requerido' });
    required(schemaPath.endTime, { message: 'Hora de fin es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      this.#schedule.update((schedule) => {
        return {
          ...schedule,
          classGroupId: this.data().groupId,
        };
      });
    });

    afterRenderEffect(() => {
      const schedule = this.data()?.schedule;
      const defaultWeekday = this.data()?.weekday;
      if (schedule) {
        this.#schedule.set({
          classGroupId: schedule.classGroupId,
          courseId: schedule.courseId,
          weekday: schedule.weekday,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location,
          remote: schedule.remote,
          remoteLink: schedule.remoteLink,
        });
      } else if (defaultWeekday) {
        this.#schedule.update((currentSchedule) => ({
          ...currentSchedule,
          weekday: defaultWeekday,
        }));
      }
    });
  }

  save(event: Event) {
    event.preventDefault();
    this.form.courseId().markAsDirty();
    this.form.weekday().markAsDirty();
    this.form.startTime().markAsDirty();
    this.form.endTime().markAsDirty();
    this.form.location().markAsDirty();
    this.form.remote().markAsDirty();
    this.form.remoteLink().markAsDirty();
    submit(this.form, async () => {
      const schedule = { ...this.form().value(), classGroupId: this.data()?.groupId };
      const existing = this.data()?.schedule;
      if (existing) {
        this.#http
          .patch('/api/v1/groups-schedules', {
            ...schedule,
            id: existing.id,
          })
          .subscribe({
            next: () => {
              this.#toast.showSuccess('Horario actualizado exitosamente');
              this.closeModal.emit();
            },
            error: (error: unknown) => {
              this.#toast.showError(error instanceof Error ? error.message : 'Error');
            },
          });
      } else {
        this.#http.post('/api/v1/groups-schedules', schedule).subscribe({
          next: () => {
            this.#toast.showSuccess('Horario creado exitosamente');
            this.closeModal.emit();
          },
          error: (error: unknown) => {
            this.#toast.showError(error instanceof Error ? error.message : 'Error');
          },
        });
      }
    });
  }
}
