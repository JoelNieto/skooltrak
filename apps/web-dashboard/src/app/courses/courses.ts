import { Loader } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorMagnifyingGlassDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';

@Component({
  selector: 'app-courses',
  imports: [RouterLink, NgIcon, Loader],
  viewProviders: [provideIcons({ phosphorMagnifyingGlassDuotone })],
  template: `
    <div class="breadcrumbs">
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
        [value]="search()"
        (input)="search.set($event.target.value)"
      />
    </label>
    @if(coursesResource.isLoading()) {
    <lib-loader />
    } @if(coursesResource.error()) {
    <p>Error al cargar cursos</p>
    } @if(coursesResource.value()) {
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
      }
    </div>
    }
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Courses {
  public search = signal<string>('');
  private apollo = inject(Apollo);
  private store = inject(Store);

  public coursesResource = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          coursesBySchoolId: Prisma.CourseGetPayload<{
            include: { studyPlan: true; subject: true; teacher: true };
          }>[];
        }>({
          query: gql`
            query CoursesBySchoolId($schoolId: String!) {
              coursesBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
                code
                createdAt
                updatedAt
                subject {
                  id
                  name
                }
                teacher {
                  id
                  name
                }
                studyPlan {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.coursesBySchoolId));
    },
  });
}
