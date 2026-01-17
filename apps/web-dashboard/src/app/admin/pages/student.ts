import { DecimalToNumber, Loader } from '@/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';

type TeacherType = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
  color: string;
};
type StudentType = DecimalToNumber<
  Prisma.StudentGetPayload<{
    include: {
      classGroup: {
        include: { studyPlan: { include: { gradeMetric: true } } };
      };
      courses: {
        include: { subject: true; teacher: { include: { user: true } } };
      };
      studentGrades: {
        include: {
          grade: {
            include: {
              course: { include: { subject: true } };
              bucket: true;
              period: true;
            };
          };
        };
      };
    };
  }> & {
    name: string;
    email: string;
    color: string;
    initials: string;
    fullName: string;
    courses: Array<
      Prisma.CourseGetPayload<{
        include: { subject: true; teacher: { include: { user: true } } };
      }> & {
        teacher: TeacherType;
      }
    >;
  }
>;

@Component({
  selector: 'app-student',
  imports: [
    RouterLink,
    Loader,
    DatePipe,
    TabList,
    Tab,
    Tabs,
    TabPanel,
    TabContent,
    DecimalPipe,
    NgClass,
  ],
  template: `
    @if (studentResource.isLoading()) {
    <lib-loader />
    } @else { @if(studentResource.hasValue()) { @let student =
    studentResource.value(); @let metric =
    student.classGroup.studyPlan.gradeMetric;
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/students">Alumnos</a></li>
        <li>{{ student.name }}</li>
      </ul>
    </div>
    <div class="card w-full bg-base-100 mt-4">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex gap-2 items-center">
            <div class="avatar avatar-placeholder">
              <div
                class="rounded-full h-12 text-white"
                [style.background]="student.color"
              >
                <span class="text-lg">{{ student.initials }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              {{ student.name }}

              <span class="text-sm text-base-content/60">{{
                student.classGroup.name
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ngTabs>
      <div class="flex justify-between items-center mt-4">
        <div
          ngTabList
          selectionMode="follow"
          selectedTab="courses"
          class="tabs tabs-box "
        >
          <div ngTab value="courses" class="tab">Cursos</div>
          <div ngTab value="info" class="tab">Informacion Personal</div>
        </div>
        <div class="w-64">
          <select class="select select-primary">
            @for(period of periodsResource.value(); track period.id) {
            <option [value]="period.id">{{ period.name }}</option>
            }
          </select>
        </div>
      </div>
      <div class="p-1">
        <div ngTabPanel value="info">
          <ng-template ngTabContent>
            <div class="bg-base-100 border-base-300 p-4 rounded-lg">
              <div class="px-4 sm:px-0">
                <h3 class="text-base/7 font-semibold">Informacion</h3>
                <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">
                  Detalles personales y de contacto
                </p>
              </div>
              <div class="mt-6 border-t border-base-300">
                <dl class="divide-y divide-base-300">
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Nombre completo
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      {{ student.fullName }}
                    </dd>
                  </div>
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Documento de identidad
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      {{ student.documentId }}
                    </dd>
                  </div>
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Grupo
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      <a
                        [routerLink]="['/groups', student.classGroup.id]"
                        class="badge badge-soft badge-primary cursor-pointer"
                      >
                        <span class="text-sm">{{
                          student.classGroup.name
                        }}</span>
                      </a>
                    </dd>
                  </div>
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Fecha de nacimiento
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      {{ student.birthDate | date : 'dd/MM/yyyy' }}
                    </dd>
                  </div>
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Dirección
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      {{ student.address }}
                    </dd>
                  </div>
                  <div
                    class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  >
                    <dt class="text-sm/6 font-medium text-base-content">
                      Teléfono
                    </dt>
                    <dd
                      class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                    >
                      {{ student.phone }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </ng-template>
        </div>
        <div ngTabPanel value="courses">
          <ng-template ngTabContent>
            <div class="flex flex-col gap-4">
              @for(course of student.courses; track course.id) {
              <div class="card bg-base-100 card-border border-base-300">
                <div class="flex flex-col p-4 border-b border-base-300">
                  <h2 class="font-semibold">
                    {{ course.subject.name }}
                  </h2>
                  <p class="text-sm text-base-content/60">
                    {{ course.teacher?.name }}
                  </p>
                </div>
                <div class="overflow-x-auto">
                  <table class="table table-sm table-zebra ">
                    <thead>
                      <tr>
                        <th class="w-1/5">Nombre</th>
                        <th class="w-1/5">Tipo</th>
                        <th class="w-1/5">Fecha</th>
                        <th class="w-1/5">Comentarios</th>
                        <th class="w-1/5">Calificacion</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for(grade of student.studentGrades; track grade.id) {
                      @if(grade.grade.course.id === course.id) {
                      <tr>
                        <td>{{ grade.grade.title }}</td>
                        <td>{{ grade.grade.bucket.name }}</td>
                        <td>{{ grade.grade.date | date : 'dd/MM/yyyy' }}</td>
                        <td>{{ grade.comments }}</td>
                        <td>
                          <span
                            class="badge badge-sm"
                            [ngClass]="{
                            'badge-success': grade.score && grade.score! >= metric!.minimumExcellence,
                            'badge-warning': grade.score && grade.score! >= metric!.minimumApproval && grade.score! < metric!.minimumExcellence,
                            'badge-error': grade.score && grade.score! < metric!.minimumApproval,
                          }"
                            >{{ grade.score | number : '1.1-1' }}</span
                          >
                        </td>
                      </tr>
                      } }
                    </tbody>
                  </table>
                </div>
              </div>
              }
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    } }
  `,
})
export default class Student {
  public id = input.required<string>();
  private apollo = inject(Apollo);
  public periodsResource = rxResource({
    params: () => ({
      schoolId: this.studentResource.value()?.schoolId,
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          periodsBySchoolId: Prisma.PeriodGetPayload<{ include: undefined }>[];
        }>({
          query: gql`
            query PeriodsBySchoolId($schoolId: String!) {
              periodsBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
              }
            }
          `,
          variables: {
            schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.periodsBySchoolId));
    },
  });

  public studentResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery<{
          student: StudentType;
        }>({
          query: gql`
            query Student($id: String!) {
              student(id: $id) {
                id
                firstName
                fatherName
                fullName
                name
                schoolId
                classGroup {
                  id
                  name
                  studyPlan {
                    id
                    name
                    gradeMetric {
                      minimumApproval
                      minimumExcellence
                    }
                  }
                }
                courses {
                  id
                  subject {
                    name
                  }
                  teacher {
                    id
                    name
                  }
                }
                studentGrades {
                  id
                  score
                  comments
                  updatedAt
                  grade {
                    id
                    title
                    date
                    comments
                    published
                    course {
                      id
                      subject {
                        name
                      }
                    }
                    bucket {
                      id
                      name
                      weight
                    }
                    period {
                      id
                      name
                      shortName
                    }
                    createdAt
                    updatedAt
                  }
                }
                color
                email
                documentId
                birthDate
                initials
                gender
                address
                phone
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            id: params.id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.student)),
  });
}
