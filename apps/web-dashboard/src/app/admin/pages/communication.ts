import { Confirmation, EmptyState, PageHeader, Toast } from '#/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { filter } from 'rxjs';
import Auth from '../../auth/auth';
import {
  AuditLog,
  CommunicationApi,
  Thread,
  ThreadType,
  UrgencyTier,
} from '../../communication/communication-api.service';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';

interface ClassGroupOption {
  id: string;
  name: string;
}

const ACTION_LABELS: Record<string, string> = {
  THREAD_CREATED: 'Hilo creado',
  MESSAGE_SENT: 'Mensaje enviado',
  BROADCAST_CREATED: 'Comunicado creado',
  BROADCAST_APPROVED: 'Comunicado aprobado',
  PARTICIPANT_ADDED: 'Participante agregado',
};

@Component({
  selector: 'app-admin-communication',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormField, PageHeader, EmptyState, TabList, Tab, Tabs, TabPanel, TabContent],
  template: `
    <lib-page-header
      title="Comunicados institucionales"
      subtitle="Aprueba avisos, consulta el historial y revisa la política de envío. Los avisos institucionales quedan pendientes de aprobación."
      actionLabel="Nuevo comunicado"
      actionIcon="campaign"
      (action)="openComposer()"
    />

    <div ngTabs>
      <div class="flex flex-wrap items-center justify-between gap-3 mt-2">
        <div ngTabList selectionMode="follow" [(selectedTab)]="selectedTab" class="tabs tabs-box">
          <div ngTab value="pending" class="tab gap-2" [class.tab-active]="selectedTab() === 'pending'">
            Pendientes de aprobación
            @if (pending().length > 0) {
              <span class="badge badge-warning badge-sm">{{ pending().length }}</span>
            }
          </div>
          <div ngTab value="sent" class="tab" [class.tab-active]="selectedTab() === 'sent'">Mensajes enviados</div>
          <div ngTab value="audit" class="tab" [class.tab-active]="selectedTab() === 'audit'">Auditoría</div>
          <div ngTab value="settings" class="tab" [class.tab-active]="selectedTab() === 'settings'">Ajustes</div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reload()">
          <span class="material-symbols-outlined text-base">refresh</span>
          Actualizar
        </button>
      </div>

      <div class="mt-4">
        <div ngTabPanel value="pending">
          <ng-template ngTabContent>
            <section class="card border border-base-200 bg-base-100">
              <div class="card-body">
                @if (pending().length === 0) {
                  <lib-empty-state
                    title="Sin pendientes"
                    description="Los comunicados institucionales aparecerán aquí hasta que se aprueben."
                    icon="task_alt"
                  />
                } @else {
                  <div class="space-y-3">
                    @for (item of pending(); track item.id) {
                      <article class="rounded-lg border border-base-200 p-4 space-y-2">
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0">
                            <p class="font-semibold truncate">{{ item.title }}</p>
                            <p class="text-sm text-base-content/70 line-clamp-3">{{ preview(item) }}</p>
                          </div>
                          <span class="badge badge-warning badge-soft shrink-0">Pendiente</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                          <span>{{ typeLabel(item.type) }}</span>
                          <span>·</span>
                          <span>{{ urgencyLabel(item.urgencyDefault) }}</span>
                          <span>·</span>
                          <span>{{ recipientCount(item) }} destinatarios</span>
                          <span>·</span>
                          <span>{{ item.createdAt | date: 'short' }}</span>
                        </div>
                        @if (canApprove()) {
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            [disabled]="approvingId() === item.id"
                            (click)="approve(item)"
                          >
                            @if (approvingId() === item.id) {
                              <span class="loading loading-spinner loading-sm"></span>
                            }
                            Aprobar y enviar
                          </button>
                        }
                      </article>
                    }
                  </div>
                }
              </div>
            </section>
          </ng-template>
        </div>

        <div ngTabPanel value="sent">
          <ng-template ngTabContent>
            <div class="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
              <section class="card border border-base-200 bg-base-100 h-fit">
                <div class="card-body">
                  <h2 class="card-title text-base">Nuevo comunicado</h2>
                  <p class="text-sm text-base-content/60">
                    Por ahora el aviso llega en la aplicación. SMS y correo se habilitarán más adelante.
                  </p>

                  <form (submit)="submit($event)" class="space-y-4 mt-2">
                    <div class="fieldset">
                      <label for="audience">Destinatarios</label>
                      <select id="audience" class="select select-primary" [formField]="form.type">
                        <option value="CLASS_GROUP">Grupo de clase</option>
                        <option value="SCHOOL_WIDE">Toda la institución</option>
                      </select>
                    </div>

                    @if (form.type().value() === 'CLASS_GROUP') {
                      <div class="fieldset">
                        <label for="class-group">Grupo</label>
                        <select id="class-group" class="select select-primary" [formField]="form.classGroupId">
                          <option [value]="''" disabled>Selecciona un grupo…</option>
                          @for (cg of classGroups.value()?.data ?? []; track cg.id) {
                            <option [value]="cg.id">{{ cg.name }}</option>
                          }
                        </select>
                      </div>
                    }

                    <div class="fieldset">
                      <label for="title">Asunto</label>
                      <input id="title" class="input input-primary" [formField]="form.title" />
                    </div>

                    <div class="fieldset">
                      <label for="body">Mensaje</label>
                      <textarea
                        id="body"
                        class="textarea textarea-primary w-full"
                        rows="5"
                        [formField]="form.body"
                      ></textarea>
                    </div>

                    <div class="fieldset">
                      <label for="urgency">Prioridad</label>
                      <select id="urgency" class="select select-primary" [formField]="form.urgency">
                        <option value="ROUTINE">Rutina</option>
                        <option value="IMPORTANT">Importante</option>
                        <option value="EMERGENCY">Emergencia (solo en la app)</option>
                      </select>
                    </div>

                    @if (form.type().value() === 'SCHOOL_WIDE') {
                      <div role="alert" class="alert alert-info text-sm">
                        Este comunicado quedará pendiente de aprobación antes de enviarse.
                      </div>
                    }

                    <div class="flex justify-end">
                      <button type="submit" class="btn btn-primary" [disabled]="submitting() || form().invalid()">
                        @if (submitting()) {
                          <span class="loading loading-spinner loading-sm"></span>
                        }
                        Enviar comunicado
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section class="card border border-base-200 bg-base-100">
                <div class="card-body">
                  <h2 class="card-title text-base">Historial de envíos</h2>
                  @if (sent().length === 0) {
                    <lib-empty-state
                      title="Sin comunicados enviados"
                      description="Cuando apruebes o envíes un aviso aparecerá aquí."
                      icon="campaign"
                    />
                  } @else {
                    <div class="overflow-x-auto">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Asunto</th>
                            <th>Destino</th>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            <th>Destinatarios</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (item of sent(); track item.id) {
                            <tr>
                              <td class="font-medium">{{ item.title }}</td>
                              <td>{{ typeLabel(item.type) }}</td>
                              <td>
                                <span class="badge badge-soft badge-sm" [class]="urgencyClass(item.urgencyDefault)">
                                  {{ urgencyLabel(item.urgencyDefault) }}
                                </span>
                              </td>
                              <td>
                                <span class="badge badge-soft badge-sm" [class]="statusClass(item.status)">
                                  {{ statusLabel(item.status) }}
                                </span>
                              </td>
                              <td>{{ recipientCount(item) }}</td>
                              <td>{{ item.createdAt | date: 'short' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </section>
            </div>
          </ng-template>
        </div>

        <div ngTabPanel value="audit">
          <ng-template ngTabContent>
            <section class="card border border-base-200 bg-base-100">
              <div class="card-body">
                <h2 class="card-title text-base">Registro de actividad</h2>
                @if (auditResource.value().length === 0) {
                  <lib-empty-state
                    title="Sin actividad"
                    description="Las acciones de comunicación se listan aquí."
                    icon="history"
                  />
                } @else {
                  <div class="overflow-x-auto">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Acción</th>
                          <th>Actor</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of auditResource.value(); track row.id) {
                          <tr>
                            <td>{{ actionLabel(row.action) }}</td>
                            <td>{{ actorName(row) }}</td>
                            <td>{{ row.createdAt | date: 'short' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </section>
          </ng-template>
        </div>

        <div ngTabPanel value="settings">
          <ng-template ngTabContent>
            <div class="grid gap-6 xl:grid-cols-2">
              <section class="card border border-base-200 bg-base-100">
                <div class="card-body">
                  <h2 class="card-title text-base">Política de aprobación</h2>
                  <p class="text-sm text-base-content/60">
                    Estas reglas se aplican a todos los comunicados de la institución.
                  </p>
                  <ul class="mt-2 space-y-3">
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Avisos a toda la institución</p>
                        <p class="text-sm text-base-content/60">Quedan en cola hasta que un admin los apruebe.</p>
                      </div>
                      <input type="checkbox" class="toggle toggle-primary" checked disabled aria-label="Aprobación institucional activa" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Avisos a un grupo de clase</p>
                        <p class="text-sm text-base-content/60">El personal puede enviarlos de inmediato.</p>
                      </div>
                      <input type="checkbox" class="toggle" checked disabled aria-label="Envío directo a grupos activo" />
                    </li>
                  </ul>
                </div>
              </section>

              <section class="card border border-base-200 bg-base-100">
                <div class="card-body">
                  <h2 class="card-title text-base">Canales de entrega</h2>
                  <p class="text-sm text-base-content/60">
                    Solo el canal en la aplicación está activo. El resto se conectará con Novu más adelante.
                  </p>
                  <ul class="mt-2 space-y-3">
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">En la aplicación</p>
                        <p class="text-sm text-base-content/60">Bandeja de padres y docentes, con avisos en vivo.</p>
                      </div>
                      <input type="checkbox" class="toggle toggle-primary" checked disabled aria-label="Canal en la aplicación activo" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Correo electrónico</p>
                        <p class="text-sm text-base-content/60">Pendiente de configurar el proveedor de envío.</p>
                      </div>
                      <input type="checkbox" class="toggle" disabled aria-label="Canal de correo inactivo" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">SMS</p>
                        <p class="text-sm text-base-content/60">Requiere consentimiento y un proveedor de SMS.</p>
                      </div>
                      <input type="checkbox" class="toggle" disabled aria-label="Canal SMS inactivo" />
                    </li>
                  </ul>
                </div>
              </section>

              <section class="card border border-base-200 bg-base-100 xl:col-span-2">
                <div class="card-body">
                  <h2 class="card-title text-base">Prioridad y horario de silencio</h2>
                  <p class="text-sm text-base-content/60">
                    Cada destinatario puede tener horario de silencio. La prioridad de emergencia lo omite, pero
                    sigue llegando solo en la aplicación.
                  </p>
                  <div class="mt-3 overflow-x-auto">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Prioridad</th>
                          <th>Comportamiento actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span class="badge badge-soft">Rutina</span></td>
                          <td>Respeta horario de silencio. Solo canal en la app.</td>
                        </tr>
                        <tr>
                          <td><span class="badge badge-warning badge-soft">Importante</span></td>
                          <td>Respeta horario de silencio. Solo canal en la app.</td>
                        </tr>
                        <tr>
                          <td><span class="badge badge-error badge-soft">Emergencia</span></td>
                          <td>Omite horario de silencio. Solo canal en la app; sin SMS ni llamada.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export default class AdminCommunication {
  #api = inject(CommunicationApi);
  #store = inject(Store);
  #toast = inject(Toast);
  #confirm = inject(Confirmation);
  #auth = inject(Auth);

  readonly submitting = signal(false);
  readonly approvingId = signal<string | null>(null);
  readonly refreshKey = signal(0);
  readonly selectedTab = signal<'pending' | 'sent' | 'audit' | 'settings'>('pending');

  readonly canApprove = computed(() => this.#auth.hasPermission('COMMUNICATION_APPROVE'));

  private formModel = signal<{
    type: ThreadType;
    classGroupId: string;
    title: string;
    body: string;
    urgency: UrgencyTier;
  }>({
    type: 'CLASS_GROUP',
    classGroupId: '',
    title: '',
    body: '',
    urgency: 'ROUTINE',
  });

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Asunto requerido' });
    required(schemaPath.body, { message: 'Mensaje requerido' });
    maxLength(schemaPath.title, 120, { message: 'Máximo 120 caracteres' });
    maxLength(schemaPath.body, 8000, { message: 'Máximo 8000 caracteres' });
    required(schemaPath.classGroupId, {
      message: 'Grupo requerido',
      when: ({ valueOf }) => valueOf(schemaPath.type) === 'CLASS_GROUP',
    });
  });

  readonly classGroups = httpResource<PaginatedResponse<ClassGroupOption>>(() => {
    const schoolId = this.#store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: '/api/v1/class-groups',
      params: { schoolId, pageSize: '100' },
    };
  });

  readonly broadcastsResource = httpResource<Thread[]>(
    () => {
      this.refreshKey();
      return '/api/v1/communication/broadcasts';
    },
    { defaultValue: [] },
  );

  readonly auditResource = httpResource<AuditLog[]>(
    () => {
      this.refreshKey();
      return '/api/v1/communication/admin/audit';
    },
    { defaultValue: [] },
  );

  readonly pending = computed(() =>
    (this.broadcastsResource.value() ?? []).filter((t) => t.status === 'PENDING_APPROVAL'),
  );

  readonly sent = computed(() =>
    (this.broadcastsResource.value() ?? []).filter((t) => t.status !== 'PENDING_APPROVAL'),
  );

  openComposer() {
    this.selectedTab.set('sent');
  }

  reload() {
    this.refreshKey.update((n) => n + 1);
  }

  submit(event: Event) {
    event.preventDefault();
    if (this.form().invalid() || this.submitting()) return;

    const { type, classGroupId, title, body, urgency } = this.formModel();
    const schoolId = this.#store.currentSchoolId();
    if (type === 'SCHOOL_WIDE' && !schoolId) {
      this.#toast.showError('Selecciona un colegio para enviar a toda la institución');
      return;
    }
    const scopeId = type === 'CLASS_GROUP' ? classGroupId : (schoolId ?? null);

    this.submitting.set(true);
    this.#api
      .createBroadcast({
        type,
        title: title.trim(),
        body: body.trim(),
        scopeId,
        urgency,
      })
      .subscribe({
        next: (thread) => {
          this.submitting.set(false);
          this.formModel.set({
            type: 'CLASS_GROUP',
            classGroupId: '',
            title: '',
            body: '',
            urgency: 'ROUTINE',
          });
          this.reload();
          if (thread.status === 'PENDING_APPROVAL') {
            this.selectedTab.set('pending');
            this.#toast.showSuccess('Comunicado enviado a aprobación');
          } else {
            this.#toast.showSuccess('Comunicado enviado');
          }
        },
        error: () => {
          this.submitting.set(false);
          this.#toast.showError('No se pudo crear el comunicado');
        },
      });
  }

  approve(item: Thread) {
    this.#confirm
      .confirm({
        title: 'Aprobar comunicado',
        message: `Se enviará “${item.title}” a ${this.recipientCount(item)} destinatarios en la aplicación.`,
        confirmText: 'Aprobar y enviar',
        severity: 'warning',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.approvingId.set(item.id);
        this.#api.approveBroadcast(item.id).subscribe({
          next: () => {
            this.approvingId.set(null);
            this.reload();
            this.selectedTab.set('sent');
            this.#toast.showSuccess('Comunicado aprobado y enviado');
          },
          error: () => {
            this.approvingId.set(null);
            this.#toast.showError('No se pudo aprobar el comunicado');
          },
        });
      });
  }

  preview(item: Thread): string {
    return item.messages?.[0]?.body ?? '';
  }

  recipientCount(item: Thread): number {
    return item.participants?.filter((p) => p.role !== 'OWNER').length ?? item.participants?.length ?? 0;
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      CLASS_GROUP: 'Grupo de clase',
      SCHOOL_WIDE: 'Institución',
      COURSE: 'Curso',
      STUDENT_GUARDIANS: 'Padres',
      DIRECT: 'Directo',
    };
    return labels[type] ?? type;
  }

  urgencyLabel(urgency: UrgencyTier): string {
    const labels: Record<UrgencyTier, string> = {
      ROUTINE: 'Rutina',
      IMPORTANT: 'Importante',
      EMERGENCY: 'Emergencia',
    };
    return labels[urgency] ?? urgency;
  }

  urgencyClass(urgency: UrgencyTier): string {
    if (urgency === 'EMERGENCY') return 'badge-error';
    if (urgency === 'IMPORTANT') return 'badge-warning';
    return 'badge-ghost';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING_APPROVAL: 'Pendiente',
      APPROVED: 'Enviado',
      ACTIVE: 'Activo',
      ARCHIVED: 'Archivado',
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    if (status === 'PENDING_APPROVAL') return 'badge-warning';
    if (status === 'APPROVED') return 'badge-success';
    return 'badge-ghost';
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  actorName(row: AuditLog): string {
    if (!row.actor) return 'Sistema';
    const name = `${row.actor.firstName ?? ''} ${row.actor.lastName ?? ''}`.trim();
    return name || 'Sistema';
  }
}
