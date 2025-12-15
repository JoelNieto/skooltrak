import { debounceSignal, Loader, Pagination, Paginator } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorMagnifyingGlassDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { map, of, tap } from 'rxjs';
import Store from '../core/store';
type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
};

type CourseType = Prisma.CourseGetPayload<{
  include: { subject: true; studyPlan: true; currentPeriod: true };
}> & {
  teacher: Teacher;
};

@Component({
  selector: 'app-courses',
  imports: [RouterLink, NgIcon, Loader, Paginator, FormsModule],
  providers: [Pagination],
  viewProviders: [provideIcons({ phosphorMagnifyingGlassDuotone })],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Cursos</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Cursos</h1>
    <label class="input input-primary input-lg">
      <ng-icon name="phosphorMagnifyingGlassDuotone" />
      <input
        class="pl-0"
        type="search"
        placeholder="Buscar..."
        [(ngModel)]="searchText"
      />
    </label>
    @if(coursesResource.isLoading()) {
    <lib-loader />
    } @if(coursesResource.error()) {
    <p>Error al cargar cursos</p>
    } @if(coursesResource.hasValue()) {
    <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
      @for(course of coursesResource.value(); track course.id) {
      <div class="card bg-base-100 card-border border-base-300">
        <figure>
          <img
            src="course-default.jpg"
            alt="Course"
            class="h-36 object-cover w-full"
          />
        </figure>
        <div class="card-body">
          <h2
            class="card-title block whitespace-nowrap text-ellipsis overflow-hidden "
          >
            {{ course.subject.name }}
          </h2>
          <p class="text-base-200">{{ course.studyPlan.name }}</p>
          <div class="card-actions justify-end">
            <a
              class="btn btn-neutral btn-soft"
              [routerLink]="['/courses', course.id]"
            >
              Ver curso
            </a>
          </div>
        </div>
      </div>
      } @empty {
      <p class="text-center text-base-200">
        No se encontraron cursos para la busqueda
        <strong class="text-primary">"{{ searchText() }}"</strong>
      </p>
      }
    </div>
    }
    <div class="flex justify-end mt-4">
      <lib-paginator
        [count]="pagination.count()"
        [take]="pagination.take()"
        [skip]="pagination.skip()"
        (skipChange)="pagination.updateSkip($event)"
        (takeChange)="pagination.updateTake($event)"
      />
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Courses {
  #apollo = inject(Apollo);
  #store = inject(Store);
  public pagination = inject(Pagination);
  public searchText = signal<string>('');
  #debouncedSearch: Signal<string>;

  public coursesResource = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
      search: this.#debouncedSearch(),
      take: this.pagination.take(),
      skip: this.pagination.skip(),
    }),
    stream: ({ params }) => {
      const { schoolId, take, skip, search } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          count: number;
          courses: CourseType[];
        }>({
          query: gql`
            query getCourses(
              $schoolId: String!
              $take: Int!
              $skip: Int!
              $search: String
            ) {
              count: coursesCount(schoolId: $schoolId, search: $search)
              courses(
                schoolId: $schoolId
                take: $take
                skip: $skip
                search: $search
              ) {
                id
                name
                shortName
                schoolId
                subject {
                  name
                }
                studyPlan {
                  name
                }
                currentPeriod {
                  name
                }
                teacher {
                  id
                  name
                }
                currentPeriodId
                subjectId
                studyPlanId
                teacherId
                code
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId,
            take,
            skip,
            search,
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.pagination.updateCount(result.data.count);
          }),
          map((result) => result.data.courses)
        );
    },
  });

  constructor() {
    this.pagination.updateTake(8);

    this.#debouncedSearch = debounceSignal(this.searchText, 400);
  }
}
