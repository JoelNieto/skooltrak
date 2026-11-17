import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Icon, UiInput, UiInputGroup } from '#/ui';

@Component({
  selector: 'app-group-courses',
  imports: [UiInput, RouterLink, UiInputGroup, Icon],
  template: ` <h4 class="text-xl font-medium mb-2">Cursos</h4>
    <label uiInputGroup>
      <ui-icon name="search" />
      <input
        uiInput
        class="pl-0"
        type="search"
        placeholder="Buscar..."
        [value]="search()"
        (input)="search.set($event.target.value)"
      />
    </label>
    <ul class="flex flex-col gap-4 mt-4">
      @for (course of filteredCourses(); track course.id) {
        <li>
          <a class="flex items-center gap-4" [routerLink]="['/courses', course.id]">
            <div class="avatar avatar-placeholder">
              <div class="bg-secondary text-secondary-content w-10 rounded-full">
                <ui-icon name="book-open" class="text-lg" />
              </div>
            </div>
            <div>
              <p>{{ course.subject.name }}</p>
              <p class="text-ink-muted text-sm">{{ course.code }}</p>
            </div>
          </a>
        </li>
      }
    </ul>`,
})
export default class GroupCourses {
  public courses = input.required<Prisma.CourseGetPayload<{ include: { subject: true } }>[]>();

  public search = signal<string>('');

  public filteredCourses = computed(() =>
    this.courses().filter(
      (course) =>
        course.subject.name.toLowerCase().includes(this.search().toLowerCase()) ||
        course.code.toLowerCase().includes(this.search().toLowerCase()),
    ),
  );
}
