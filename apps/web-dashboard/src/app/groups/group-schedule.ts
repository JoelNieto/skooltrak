import { Modal } from '@/ui';
import { Component, inject, input } from '@angular/core';
import { Prisma } from '@generated/prisma';
import GroupScheduleForm from './group-schedule-form';

@Component({
  selector: 'app-group-schedule',
  imports: [],
  template: `<div class="flex justify-between items-center">
      <h4 class="text-xl font-medium mb-2">Horario</h4>
      <button class="btn btn-primary" (click)="editSchedule()">
        Agregar clases
      </button>
    </div>
    <div class="w-full overflow-x-auto">
      <table class="table-fixed min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th class="w-24 border px-4 py-2 bg-gray-100 text-sm">Hora</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Lunes</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Martes</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Miércoles</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Jueves</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Viernes</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Sábado</th>
            <th class="w-36 border px-4 py-2 bg-gray-100 text-sm">Domingo</th>
          </tr>
        </thead>
        <tbody>
          @for (hour of ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
          '13:00', '14:00', '15:00', '16:00', '17:00']; track hour) {
          <tr>
            <td
              class="border px-4 py-2 bg-gray-50 font-mono text-xs text-center sticky left-0 z-10"
            >
              {{ hour }}
            </td>
            <!-- Loop over each day, hours as drop containers -->
            <td class="border px-2 py-2 h-20 relative bg-white">
              <!-- Items for this hour/day will go here, container for future drag/drop -->
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div> `,
})
export default class GroupSchedule {
  public id = input<string>();
  #modal = inject(Modal);

  public editSchedule(
    schedule?: Prisma.ClassGroupWeeklyScheduleGetPayload<undefined>
  ) {
    this.#modal.open(GroupScheduleForm, {
      title: schedule ? 'Editar clase' : 'Agregar clase',
      data: {
        schedule,
        groupId: this.id(),
      },
    });
  }
}
