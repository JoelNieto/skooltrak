import { Component, computed, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorMagnifyingGlassDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
type Student = Prisma.StudentGetPayload<undefined> & {
  name: string;
  initials: string;
};
@Component({
  selector: 'app-group-students',
  imports: [NgIcon],
  providers: [
    provideIcons({
      phosphorMagnifyingGlassDuotone,
    }),
  ],
  template: `<h4 class="text-xl font-medium mb-2">Estudiantes</h4>
    <label class="input input-primary w-full md:w-96">
      <ng-icon name="phosphorMagnifyingGlassDuotone" />
      <input
        class="pl-0"
        type="search"
        placeholder="Buscar..."
        [value]="search()"
        (input)="search.set($event.target.value)"
      />
    </label>
    <ul class="flex flex-col gap-4 mt-4">
      @for(student of filteredStudents(); track student.id) {
      <li>
        <div class="flex items-center gap-4">
          <div class="avatar avatar-online avatar-placeholder">
            <div class="bg-primary text-primary-content w-10 rounded-full">
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
        student.documentId.toLowerCase().includes(this.search().toLowerCase())
    )
  );

  public search = signal<string>('');
}
