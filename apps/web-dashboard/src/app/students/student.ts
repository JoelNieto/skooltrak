import { DecimalToNumber, Loader } from '@/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { $Enums, Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import StudentAttendanceReport from './student-attendance-report';

type TeacherType = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
  color: string;
};

type ParentType = Prisma.ParentGetPayload<{ include: undefined }> & {
  name: string;
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
      parents: true;
    };
  }> & {
    name: string;
    email: string;
    color: string;
    initials: string;
    fullName: string;
    enrollmentStatus: $Enums.EnrollmentStatus;
    bloodType: string;
    allergies: string;
    medicalNotes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    parents: ParentType[];
    courses: Array<
      Prisma.CourseGetPayload<{
        include: { subject: true; teacher: { include: { user: true } } };
      }> & {
        teacher: TeacherType;
      }
    >;
  }
>;

const ENROLLMENT_STATUS_LABELS: Record<$Enums.EnrollmentStatus, string> = {
  ACTIVE: 'Activo',
  CANDIDATE: 'Candidato',
  RETIRED: 'Retirado',
};

const ENROLLMENT_STATUS_COLORS: Record<$Enums.EnrollmentStatus, string> = {
  ACTIVE: 'badge-success',
  CANDIDATE: 'badge-warning',
  RETIRED: 'badge-neutral',
};

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
    StudentAttendanceReport,
  ],
  template: `
    @if (studentResource.isLoading()) {
      <lib-loader />
    } @else {
      @if (studentResource.hasValue()) {
        @let student = studentResource.value();
        @let metric = student.classGroup?.studyPlan?.gradeMetric;
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
              <div class="flex gap-3 items-center">
                <div class="avatar avatar-placeholder">
                  <div class="rounded-full h-12 text-white" [style.background]="student.color">
                    <span class="text-lg">{{ student.initials }}</span>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ student.name }}</span>
                    <span class="badge badge-sm" [ngClass]="getStatusColor(student.enrollmentStatus)">
                      {{ getStatusLabel(student.enrollmentStatus) }}
                    </span>
                  </div>
                  @if (student.classGroup) {
                    <span class="text-sm text-base-content/60">{{ student.classGroup.name }}</span>
                  } @else {
                    <span class="text-sm text-base-content/50">Sin grupo asignado</span>
                  }
                </div>
              </div>
              <a [routerLink]="['/students', student.id, 'edit']" class="btn btn-primary btn-sm">
                <span class="material-symbols-outlined text-lg">edit</span>
                Editar
              </a>
            </div>
          </div>
        </div>

        <div ngTabs>
          <div class="flex justify-between items-center mt-4">
            <div ngTabList selectionMode="follow" selectedTab="info" class="tabs tabs-box">
              <div ngTab value="info" class="tab">Información Personal</div>
              <div ngTab value="medical" class="tab">Información Médica</div>
              <div ngTab value="courses" class="tab">Cursos</div>
              <div ngTab value="attendance" class="tab">Asistencia</div>
            </div>
            <div class="w-64">
              <select class="select select-primary">
                @for (period of periodsResource.value(); track period.id) {
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
                    <h3 class="text-base/7 font-semibold">Información Personal</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Detalles personales y de contacto</p>
                  </div>
                  <div class="mt-6 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Nombre completo</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.fullName }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Documento de identidad</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.documentId }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Grupo</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          @if (student.classGroup) {
                            <a
                              [routerLink]="['/groups', student.classGroup.id]"
                              class="badge badge-soft badge-primary cursor-pointer"
                            >
                              <span class="text-sm">{{ student.classGroup.name }}</span>
                            </a>
                          } @else {
                            <span class="text-base-content/50">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Fecha de nacimiento</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.birthDate | date: 'dd/MM/yyyy' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Correo electrónico</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">{{ student.email }}</dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.phone || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Dirección</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.address || '-' }}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <!-- Emergency Contact Section -->
                  <div class="mt-8 px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Contacto de Emergencia</h3>
                  </div>
                  <div class="mt-4 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Nombre</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.emergencyContactName || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.emergencyContactPhone || '-' }}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <!-- Parents Section -->
                  @if (student.parents && student.parents.length > 0) {
                    <div class="mt-8 px-4 sm:px-0">
                      <h3 class="text-base/7 font-semibold">Padres/Representantes</h3>
                    </div>
                    <div class="mt-4 border-t border-base-300">
                      <dl class="divide-y divide-base-300">
                        @for (parent of student.parents; track parent.id) {
                          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt class="text-sm/6 font-medium text-base-content">{{ parent.relationship }}</dt>
                            <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                              <div>{{ parent.name }}</div>
                              <div class="text-sm text-base-content/60">{{ parent.phone }} · {{ parent.email }}</div>
                            </dd>
                          </div>
                        }
                      </dl>
                    </div>
                  }
                </div>
              </ng-template>
            </div>

            <div ngTabPanel value="medical">
              <ng-template ngTabContent>
                <div class="bg-base-100 border-base-300 p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información Médica</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Datos médicos relevantes del estudiante</p>
                  </div>
                  <div class="mt-6 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Tipo de sangre</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.bloodType || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Alergias</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.allergies || 'Ninguna registrada' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Notas médicas</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ student.medicalNotes || 'Ninguna' }}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </ng-template>
            </div>
            <div ngTabPanel value="attendance">
              <ng-template ngTabContent>
                <app-student-attendance-report [studentId]="id()" />
              </ng-template>
            </div>

            <div ngTabPanel value="courses">
              <ng-template ngTabContent>
                <div class="flex flex-col gap-4">
                  @for (course of student.courses; track course.id) {
                    <div class="card bg-base-100 card-border border-base-300">
                      <div class="flex flex-col p-4 border-b border-base-300">
                        <h2 class="font-semibold">{{ course.subject.name }}</h2>
                        <p class="text-sm text-base-content/60">{{ course.teacher.name }}</p>
                      </div>
                      <div class="overflow-x-auto">
                        <table class="table table-sm table-zebra">
                          <thead>
                            <tr>
                              <th class="w-1/5">Nombre</th>
                              <th class="w-1/5">Tipo</th>
                              <th class="w-1/5">Fecha</th>
                              <th class="w-1/5">Comentarios</th>
                              <th class="w-1/5">Calificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (grade of student.studentGrades; track grade.id) {
                              @if (grade.grade.course.id === course.id) {
                                <tr>
                                  <td>{{ grade.grade.title }}</td>
                                  <td>{{ grade.grade.bucket.name }}</td>
                                  <td>{{ grade.grade.date | date: 'dd/MM/yyyy' }}</td>
                                  <td>{{ grade.comments }}</td>
                                  <td>
                                    <span
                                      class="badge badge-sm"
                                      [ngClass]="{
                                        'badge-success':
                                          metric && grade.score && grade.score! >= metric.minimumExcellence,
                                        'badge-warning':
                                          metric &&
                                          grade.score &&
                                          grade.score! >= metric.minimumApproval &&
                                          grade.score! < metric.minimumExcellence,
                                        'badge-error': metric && grade.score && grade.score! < metric.minimumApproval,
                                      }"
                                    >
                                      {{ grade.score | number: '1.1-1' }}
                                    </span>
                                  </td>
                                </tr>
                              }
                            }
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
      }
    }
  `,
})
export default class Student {
  public id = input.required<string>();
  private apollo = inject(Apollo);

  getStatusLabel(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_COLORS[status] || 'badge-ghost';
  }

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
                enrollmentStatus
                bloodType
                allergies
                medicalNotes
                emergencyContactName
                emergencyContactPhone
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
                parents {
                  id
                  firstName
                  fatherName
                  name
                  phone
                  email
                  relationship
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
