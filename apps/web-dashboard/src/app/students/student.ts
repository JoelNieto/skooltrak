import { Loader } from '@/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { httpResource, HttpClient } from '@angular/common/http';
import { $Enums } from '@generated/prisma';
import Auth from '../auth/auth';
import Store from '../core/store';
import { isValidId } from '../core/validators';
import StudentAttendanceReport from './student-attendance-report';

/** REST `GET /api/v1/students/:id` payload (includes nested relations used by this page). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StudentView = any;

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
    FormsModule,
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
      @if (studentResource.hasValue() && studentResource.value()?.id) {
        @let student = studentResource.value()!;
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
                    <span class="badge badge-sm" [ngClass]="getStatusColor(student.enrollmentStatus ?? 'ACTIVE')">
                      {{ getStatusLabel(student.enrollmentStatus ?? 'ACTIVE') }}
                    </span>
                    @if (student.user?.emailVerified) {
                      <span class="badge badge-success badge-sm gap-1">
                        <span class="material-symbols-outlined text-xs">check_circle</span>
                        Verificado
                      </span>
                    } @else {
                      <span class="badge badge-warning badge-sm gap-1">
                        <span class="material-symbols-outlined text-xs">schedule</span>
                        Pendiente
                      </span>
                    }
                  </div>
                  @if (student.classGroup) {
                    <span class="text-sm text-base-content/60">{{ student.classGroup.name }}</span>
                  } @else {
                    <span class="text-sm text-base-content/50">Sin grupo asignado</span>
                  }
                </div>
              </div>
              <div class="flex gap-2">
                <a [routerLink]="['/students', student.id, 'grade-report']" class="btn btn-ghost btn-sm">
                  <span class="material-symbols-outlined text-lg">description</span>
                  Boletín
                </a>
                @if (auth.hasPermission('MANAGE_STUDENTS')) {
                  <a [routerLink]="['/students', student.id, 'edit']" class="btn btn-primary btn-sm">
                    <span class="material-symbols-outlined text-lg">edit</span>
                    Editar
                  </a>
                }
              </div>
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
              <select class="select select-primary" [ngModel]="periodId()" (ngModelChange)="periodId.set($event)">
                <option disabled selected value="">Selecciona un periodo...</option>
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
                        <h2 class="font-semibold">{{ course.subject?.name }}</h2>
                        <p class="text-sm text-base-content/60">{{ course.teacher?.name ?? 'Sin profesor' }}</p>
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
                              @if (grade.grade?.course?.id === course.id) {
                                <tr>
                                  <td>{{ grade.grade?.title }}</td>
                                  <td>{{ grade.grade?.bucket?.name }}</td>
                                  <td>{{ grade.grade?.date | date: 'dd/MM/yyyy' }}</td>
                                  <td>{{ grade.comments }}</td>
                                  <td>
                                    <span class="badge badge-sm" [ngClass]="getGradeBadgeClass(grade, metric)">
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
      } @else {
        <div>No se encontró el alumno</div>
      }
    }
  `,
})
export default class Student {
  public id = input.required<string>();
  private http = inject(HttpClient);
  private store = inject(Store);
  public auth = inject(Auth);
  public periodId = signal<string>('');

  getStatusLabel(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: $Enums.EnrollmentStatus): string {
    return ENROLLMENT_STATUS_COLORS[status] || 'badge-ghost';
  }

  getGradeBadgeClass(
    grade: { score?: number | null },
    metric: { minimumExcellence?: number; minimumApproval?: number } | null | undefined,
  ): string {
    if (!metric || grade.score == null || metric.minimumExcellence == null || metric.minimumApproval == null)
      return 'badge-ghost';
    if (grade.score >= metric.minimumExcellence) return 'badge-success';
    if (grade.score >= metric.minimumApproval) return 'badge-warning';
    return 'badge-error';
  }

  public periodsResource = httpResource<Array<{ id: string; name: string; startDate: string; endDate: string }>>(
    () => {
      const year = this.store.currentSchool()?.currentYear;
      if (!year) {
        return undefined;
      }
      return {
        url: '/api/v1/periods/by-year',
        params: { year: String(year) },
      };
    },
    { defaultValue: [] },
  );

  private currentPeriodId = computed(() => {
    const periods = this.periodsResource.value();
    if (!periods?.length) return '';
    const today = new Date();
    const current = periods.find((p) => new Date(p.startDate ?? 0) <= today && today <= new Date(p.endDate ?? 0));
    return current?.id ?? '';
  });

  constructor() {
    afterRenderEffect(() => {
      const id = this.currentPeriodId();
      if (id) this.periodId.set(id);
    });
  }

  public studentResource = httpResource<StudentView | null>(() =>
    isValidId(this.id()) ? `/api/v1/students/${this.id()}` : undefined,
  );
}
