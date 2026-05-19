import { Toast } from '#/ui';
import { httpResource, HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Prisma } from '@generated/prisma';

@Component({
  selector: 'app-group-schedule-form',
  imports: [FormField],
  template: ` <form (submit)="save($event)" novalidate="novalidate">
    <div class="flex flex-col md:grid md:grid-cols-2 gap-2">
      <div class="fieldset">
        <label for="courseId">Curso</label>
        <select
          [formField]="form.courseId"
          class="select select-primary"
          [class.ng-dirty]="form.courseId().dirty()"
          [class.ng-invalid]="form.courseId().invalid()"
        >
          <option value="" disabled>---Seleccionar---</option>
          @for (course of courses.value(); track course.id) {
          <option [value]="course.id">{{ course.name }}</option>
          }
        </select>
      </div>
      <div class="fieldset">
        <label for="weekday">Día de la semana</label>
        <select
          [formField]="form.weekday"
          class="select select-primary"
          [class.ng-dirty]="form.weekday().dirty()"
          [class.ng-invalid]="form.weekday().invalid()"
        >
          <option value="MONDAY">Lunes</option>
          <option value="TUESDAY">Martes</option>
          <option value="WEDNESDAY">Miércoles</option>
          <option value="THURSDAY">Jueves</option>
          <option value="FRIDAY">Viernes</option>
          <option value="SATURDAY">Sábado</option>
          <option value="SUNDAY">Domingo</option>
        </select>
      </div>
      <div class="fieldset">
        <label for="startTime">Hora de inicio</label>
        <input
          [formField]="form.startTime"
          type="time"
          class="input input-primary"
          [class.ng-dirty]="form.startTime().dirty()"
          [class.ng-invalid]="form.startTime().invalid()"
        />
      </div>
      <div class="fieldset">
        <label for="endTime">Hora de fin</label>
        <input
          [formField]="form.endTime"
          type="time"
          class="input input-primary"
          [class.ng-dirty]="form.endTime().dirty()"
          [class.ng-invalid]="form.endTime().invalid()"
        />
      </div>
      <div class="fieldset md:col-span-2">
        <label for="location">Ubicación</label>
        <input [formField]="form.location!" type="text" class="input input-primary" />
      </div>
      <div class="fieldset">
        <label for="remote">Remoto</label>
        <input [formField]="form.remote!" type="checkbox" class="checkbox checkbox-primary" />
      </div>
      <div class="fieldset">
        <label for="remoteLink">Enlace remoto</label>
        <input [formField]="form.remoteLink!" type="text" class="input input-primary" />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button type="button" class="btn btn-ghost" (click)="closeModal.emit()">Cancelar</button>
      <button type="submit" class="btn btn-primary">Guardar</button>
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
      if (this.data()?.schedule) {
        this.#http
          .patch('/api/v1/groups-schedules', {
            ...schedule,
            id: this.data()?.schedule?.id!,
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
