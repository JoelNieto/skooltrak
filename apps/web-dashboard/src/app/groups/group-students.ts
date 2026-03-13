import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';

type Student = Prisma.StudentGetPayload<{
  include: { user: true };
}> & {
  name: string;
  initials: string;
};
@Component({
  selector: 'app-group-students',
  imports: [RouterLink],

  template: `<h4 class="text-xl font-medium mb-2">Estudiantes</h4>
    <label class="input input-primary w-full md:w-96">
      <span class="material-symbols-outlined">search</span>
      <input
        class="pl-0"
        type="search"
        placeholder="Buscar..."
        [value]="search()"
        (input)="search.set($event.target.value)"
      />
    </label>
    <ul class="flex-col gap-4 mt-4 md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      @for (student of filteredStudents(); track student.id) {
        <li class="card bg-base-200 p-4 hover:bg-base-200 cursor-pointer" [routerLink]="['/students', student.id]">
          <div class="flex items-center gap-4">
            <div class="avatar avatar-placeholder">
              <div class="text-primary-content w-10 rounded-full" [style.background]="student.user.color">
                <span class="text-sm">{{ student.initials }}</span>
              </div>
            </div>
            <div>
              <p>{{ student.name }}</p>
              <p class="text-base-200 text-sm">{{ student.documentId }}</p>
            </div>
          </div>
        </li>
      }
    </ul> `,
})
export default class GroupStudents {
  public students = input.required<Student[]>();

  public filteredStudents = computed(() =>
    this.students().filter(
      (student) =>
        student.name.toLowerCase().includes(this.search().toLowerCase()) ||
        student.documentId.toLowerCase().includes(this.search().toLowerCase()),
    ),
  );

  public search = signal<string>('');
}
