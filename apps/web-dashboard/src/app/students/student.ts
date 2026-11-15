import { Badge, BadgeTone, Breadcrumbs, Button, Card, CardBody, Loader, Toast, UiSelect, UiTable } from '#/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { $Enums } from '@generated/prisma';
import * as QRCode from 'qrcode';
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

const ENROLLMENT_STATUS_TONES: Record<$Enums.EnrollmentStatus, BadgeTone> = {
  ACTIVE: 'success',
  CANDIDATE: 'warning',
  RETIRED: 'neutral',
};

@Component({
  selector: 'app-student',
  imports: [
    Breadcrumbs,
    UiTable,
    Badge,
    Card,
    CardBody,
    UiSelect,
    Button,
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
    StudentAttendanceReport,
  ],
  template: `
    @if (studentResource.isLoading()) {
      <lib-loader />
    } @else {
      @if (studentResource.hasValue() && studentResource.value()?.id) {
        @let student = studentResource.value()!;
        @let metric = $safeNavigationMigration(student.classGroup?.studyPlan?.gradeMetric);
        <ui-breadcrumbs
          [items]="[{ label: 'Inicio', link: '/' }, { label: 'Alumnos', link: '/students' }, { label: student.name }]"
        />
        <div uiCard class="w-full mt-4">
          <div uiCardBody>
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
                    <span uiBadge size="sm" [tone]="enrollmentTone(student.enrollmentStatus ?? 'ACTIVE')">
                      {{ getStatusLabel(student.enrollmentStatus ?? 'ACTIVE') }}
                    </span>
                    @if (student.user?.emailVerified) {
                      <span uiBadge tone="success" size="sm" class="gap-1">
                        <span class="material-symbols-outlined text-xs">check_circle</span>
                        Verificado
                      </span>
                    } @else {
                      <span uiBadge tone="warning" size="sm" class="gap-1">
                        <span class="material-symbols-outlined text-xs">schedule</span>
                        Pendiente
                      </span>
                    }
                  </div>
                  @if (student.classGroup) {
                    <span class="text-sm text-ink-muted">{{ student.classGroup.name }}</span>
                  } @else {
                    <span class="text-sm text-ink-subtle">Sin grupo asignado</span>
                  }
                </div>
              </div>
              <div class="flex flex-col items-end gap-3">
                <div class="flex gap-2">
                  <a uiButton variant="ghost" size="sm" [routerLink]="['/students', student.id, 'grade-report']">
                    <span class="material-symbols-outlined text-lg">description</span>
                    Boletín
                  </a>
                  @if (auth.hasPermission('MANAGE_STUDENTS')) {
                    <a uiButton variant="primary" size="sm" [routerLink]="['/students', student.id, 'edit']">
                      <span class="material-symbols-outlined text-lg">edit</span>
                      Editar
                    </a>
                  }
                </div>
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
              <select uiSelect [ngModel]="periodId()" (ngModelChange)="periodId.set($event)">
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
                <div class="bg-surface-1 border-line p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información Personal</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Detalles personales y de contacto</p>
                  </div>
                  <div class="mt-6 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Nombre completo</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.fullName }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Documento de identidad</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.documentId }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Grupo</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          @if (student.classGroup) {
                            <a
                              uiBadge
                              tone="action"
                              [routerLink]="['/groups', student.classGroup.id]"
                              class="cursor-pointer"
                            >
                              <span class="text-sm">{{ student.classGroup.name }}</span>
                            </a>
                          } @else {
                            <span class="text-ink-subtle">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Fecha de nacimiento</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.birthDate | date: 'dd/MM/yyyy' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Correo electrónico</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">{{ student.email }}</dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.phone || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Dirección</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.address || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Código de matrícula</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          <div class="flex items-center gap-2">
                            @if (student.enrollmentCode) {
                              <span uiBadge tone="action" class="font-mono text-sm">{{ student.enrollmentCode }}</span>
                              <button
                                uiButton
                                variant="ghost"
                                size="sm"
                                iconOnly
                                type="button"
                                title="Copiar código"
                                (click)="copyCode()"
                              >
                                <span class="material-symbols-outlined text-lg">content_copy</span>
                              </button>
                            } @else {
                              <span class="text-sm text-ink-subtle">Sin código</span>
                            }
                            @if (auth.hasPermission('MANAGE_STUDENTS')) {
                              <button
                                uiButton
                                [loading]="regenerating()"
                                variant="ghost"
                                size="sm"
                                iconOnly
                                type="button"
                                title="Regenerar código"
                                [disabled]="regenerating()"
                                (click)="regenerate()"
                              >
                                @if (!regenerating()) {
                                  <span class="material-symbols-outlined text-lg">refresh</span>
                                }
                              </button>
                            }
                            @if (student.enrollmentCode && student.enrollmentCodeGeneratedAt) {
                              <span class="text-xs text-ink-subtle">
                                Generado {{ student.enrollmentCodeGeneratedAt | date: 'dd/MM/yyyy HH:mm' }}
                              </span>
                            }
                          </div>
                        </dd>
                      </div>
                      @if (auth.hasPermission('MANAGE_STUDENTS')) {
                        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt class="text-sm/6 font-medium text-ink-strong">Conexión de padres (QR)</dt>
                          <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                            @if (connectQr(); as qr) {
                              <div class="flex flex-col gap-2">
                                <!-- eslint-disable @nx/workspace-design-tokens -- QR codes need a white quiet zone to scan in dark mode -->
                                <img
                                  [src]="qr"
                                  alt="Código QR de conexión"
                                  class="h-40 w-40 rounded-lg border border-line bg-white p-2"
                                />
                                <!-- eslint-enable @nx/workspace-design-tokens -->
                                <div class="flex items-center gap-2">
                                  <button uiButton size="sm" type="button" (click)="copyConnectUrl()">
                                    <span class="material-symbols-outlined text-lg">link</span>
                                    Copiar enlace
                                  </button>
                                  <button
                                    uiButton
                                    [loading]="connectQrLoading()"
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    [disabled]="connectQrLoading()"
                                    (click)="generateConnectQr()"
                                  >
                                    @if (!connectQrLoading()) {
                                      <span class="material-symbols-outlined text-lg">refresh</span>
                                    }
                                    Regenerar
                                  </button>
                                </div>
                                <span class="text-xs text-ink-subtle">
                                  El código es de un solo uso y expira en 30 días. Regenerarlo invalida el anterior.
                                </span>
                              </div>
                            } @else {
                              <button
                                uiButton
                                [loading]="connectQrLoading()"
                                variant="primary"
                                size="sm"
                                type="button"
                                [disabled]="connectQrLoading()"
                                (click)="generateConnectQr()"
                              >
                                @if (!connectQrLoading()) {
                                  <span class="material-symbols-outlined text-lg">qr_code_2</span>
                                }
                                Generar QR de conexión
                              </button>
                            }
                          </dd>
                        </div>
                      }
                    </dl>
                  </div>

                  <!-- Emergency Contact Section -->
                  <div class="mt-8 px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Contacto de Emergencia</h3>
                  </div>
                  <div class="mt-4 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Nombre</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.emergencyContactName || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
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
                    <div class="mt-4 border-t border-line">
                      <dl class="divide-y divide-line">
                        @for (parent of student.parents; track parent.id) {
                          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt class="text-sm/6 font-medium text-ink-strong">{{ parent.relationship }}</dt>
                            <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                              <div>{{ parent.name }}</div>
                              <div class="text-sm text-ink-muted">{{ parent.phone }} · {{ parent.email }}</div>
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
                <div class="bg-surface-1 border-line p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información Médica</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Datos médicos relevantes del estudiante</p>
                  </div>
                  <div class="mt-6 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Tipo de sangre</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.bloodType || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Alergias</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ student.allergies || 'Ninguna registrada' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Notas médicas</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
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
                    <div uiCard>
                      <div class="flex flex-col p-4 border-b border-line">
                        <h2 class="font-semibold">{{ course.subject?.name }}</h2>
                        <p class="text-sm text-ink-muted">{{ course.teacher?.name ?? 'Sin profesor' }}</p>
                      </div>
                      <div class="overflow-x-auto">
                        <table uiTable density="compact" zebra>
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
                                  <td>{{ $safeNavigationMigration(grade.grade?.date) | date: 'dd/MM/yyyy' }}</td>
                                  <td>{{ grade.comments }}</td>
                                  <td>
                                    <span uiBadge size="sm" [tone]="gradeTone(grade, metric)">
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

  enrollmentTone(status: $Enums.EnrollmentStatus): BadgeTone {
    return ENROLLMENT_STATUS_TONES[status] || 'neutral';
  }

  gradeTone(
    grade: { score?: number | null },
    metric: { minimumExcellence?: number; minimumApproval?: number } | null | undefined,
  ): BadgeTone {
    if (!metric || grade.score == null || metric.minimumExcellence == null || metric.minimumApproval == null)
      return 'neutral';
    if (grade.score >= metric.minimumExcellence) return 'success';
    if (grade.score >= metric.minimumApproval) return 'warning';
    return 'danger';
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

  public regenerating = signal(false);
  private toasts = inject(Toast);

  public regenerate() {
    if (!isValidId(this.id())) return;
    if (!window.confirm('Regenerar el código revocará el actual. ¿Continuar?')) return;
    this.regenerating.set(true);
    this.http
      .post<{
        id: string;
        enrollmentCode: string;
        enrollmentCodeGeneratedAt: string;
      }>(`/api/v1/students/${this.id()}/enrollment-code/regenerate`, {})
      .subscribe({
        next: () => {
          this.regenerating.set(false);
          this.toasts.showSuccess('Código regenerado');
          this.studentResource.reload();
        },
        error: () => {
          this.regenerating.set(false);
          this.toasts.showError('No se pudo regenerar el código');
        },
      });
  }

  public async copyCode() {
    const code = this.studentResource.value()?.enrollmentCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.toasts.showSuccess('Código copiado');
    } catch {
      this.toasts.showError('No se pudo copiar el código');
    }
  }

  public connectQr = signal<string | null>(null);
  public connectQrLoading = signal(false);
  private connectUrl = signal<string | null>(null);

  /** Issue a single-use QR child-connect token and render it client-side. */
  public generateConnectQr() {
    if (!isValidId(this.id())) return;
    this.connectQrLoading.set(true);
    this.http
      .post<{ token: string; url: string }>('/api/v1/auth/child-connect/issue', {
        studentId: this.id(),
      })
      .subscribe({
        next: async ({ url }) => {
          try {
            const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
            this.connectUrl.set(url);
            this.connectQr.set(dataUrl);
          } catch {
            this.toasts.showError('No se pudo generar el código QR');
          } finally {
            this.connectQrLoading.set(false);
          }
        },
        error: () => {
          this.connectQrLoading.set(false);
          this.toasts.showError('No se pudo generar el código de conexión');
        },
      });
  }

  public async copyConnectUrl() {
    const url = this.connectUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.toasts.showSuccess('Enlace copiado');
    } catch {
      this.toasts.showError('No se pudo copiar el enlace');
    }
  }
}
