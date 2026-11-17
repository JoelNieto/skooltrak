import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardBody,
  CardTitle,
  Confirmation,
  EmptyState,
  Icon,
  PageHeader,
  Toast,
  UiChoice,
  UiField,
  UiInput,
  UiSelect,
  UiTab,
  UiTabContent,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTabList,
  UiTabPanel,
  UiTabs,
  UiToggle,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { filter } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';
import { AuditLog, CommunicationApi, Thread, ThreadType, UrgencyTier } from './communication-api.service';

/** Targets the caller may broadcast to (teachers: own courses + related groups — BR-COM-002.7). */
interface BroadcastAudiences {
  classGroups: { id: string; name: string }[];
  courses: { id: string; name: string; code: string }[];
}

const ACTION_LABELS: Record<string, string> = {
  THREAD_CREATED: 'Hilo creado',
  MESSAGE_SENT: 'Mensaje enviado',
  BROADCAST_CREATED: 'Comunicado creado',
  BROADCAST_APPROVED: 'Comunicado aprobado',
  BROADCAST_UPDATED: 'Comunicado actualizado',
  PARTICIPANT_ADDED: 'Participante agregado',
};

@Component({
  selector: 'app-communication-broadcasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    Badge,
    Card,
    CardBody,
    CardTitle,
    UiChoice,
    UiField,
    UiInput,
    UiSelect,
    UiToggle,
    Button,
    DatePipe,
    FormField,
    PageHeader,
    EmptyState,
    UiTabs,
    UiTabList,
    UiTab,
    UiTabPanel,
    UiTabContent,
    Icon,
  ],
  template: `
    <lib-page-header
      title="Comunicados institucionales"
      subtitle="Aprueba avisos, consulta el historial y revisa la política de envío. Los avisos institucionales quedan pendientes de aprobación."
      actionLabel="Nuevo comunicado"
      actionIcon="megaphone"
      (action)="openComposer()"
    />

    <div uiTabs>
      <div class="flex flex-wrap items-center justify-between gap-3 mt-2">
        <div uiTabList [(selectedTab)]="selectedTab" aria-label="Comunicados">
          <button uiTab value="pending">
            Pendientes de aprobación
            @if (pending().length > 0) {
              <span uiBadge tone="warning" size="sm">{{ pending().length }}</span>
            }
          </button>
          <button uiTab value="sent">Mensajes enviados</button>
          <button uiTab value="audit">Auditoría</button>
          <button uiTab value="settings">Ajustes</button>
        </div>
        <button uiButton variant="ghost" size="sm" type="button" (click)="reload()">
          <ui-icon name="refresh-cw" class="text-base" />
          Actualizar
        </button>
      </div>

      <div class="mt-4">
        <div uiTabPanel value="pending">
          <ng-template uiTabContent>
            <section uiCard>
              <div uiCardBody>
                @if (broadcastsList.phase() === 'error') {
                  <div uiAlert tone="danger">
                    <ui-icon name="circle-alert" />
                    <span>No se pudieron cargar los comunicados.</span>
                    <button uiButton size="sm" type="button" (click)="broadcastsResource.reload()">Reintentar</button>
                  </div>
                } @else if (broadcastsList.phase() !== 'ready') {
                  <p class="text-sm text-ink-muted" role="status">Cargando…</p>
                } @else if (pending().length === 0) {
                  <lib-empty-state
                    title="Sin pendientes"
                    description="Los comunicados institucionales aparecerán aquí hasta que se aprueben."
                    icon="circle-check-big"
                  />
                } @else {
                  <div class="space-y-3">
                    @for (item of pending(); track item.id) {
                      <article class="rounded-lg border border-line p-4 space-y-2">
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0">
                            <p class="font-semibold truncate">{{ item.title }}</p>
                            <p class="text-sm text-ink-muted line-clamp-3">{{ preview(item) }}</p>
                          </div>
                          <span uiBadge tone="warning" class="shrink-0">Pendiente</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                          <span>{{ typeLabel(item.type) }}</span>
                          <span>·</span>
                          <span>{{ urgencyLabel(item.urgencyDefault) }}</span>
                          <span>·</span>
                          <span>{{ recipientCount(item) }} destinatarios</span>
                          <span>·</span>
                          <span>{{ repliesLabel(item) }}</span>
                          <span>·</span>
                          <span>{{ item.createdAt | date: 'short' }}</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                          <ui-choice label="Permitir respuestas" class="py-0">
                            <input
                              uiToggle
                              size="sm"
                              type="checkbox"
                              [checked]="item.repliesAllowed !== false"
                              (change)="toggleReplies(item, $event)"
                            />
                          </ui-choice>
                          @if (canApprove()) {
                            <button
                              uiButton
                              [loading]="approvingId() === item.id"
                              variant="primary"
                              size="sm"
                              type="button"
                              [disabled]="approvingId() === item.id"
                              (click)="approve(item)"
                            >
                              Aprobar y enviar
                            </button>
                          }
                        </div>
                      </article>
                    }
                  </div>
                }
              </div>
            </section>
          </ng-template>
        </div>

        <div uiTabPanel value="sent">
          <ng-template uiTabContent>
            <div class="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
              <section uiCard class="h-fit">
                <div uiCardBody>
                  <h2 uiCardTitle class="text-base">Nuevo comunicado</h2>
                  <p class="text-sm text-ink-muted">
                    Por ahora el aviso llega en la aplicación. SMS y correo se habilitarán más adelante.
                  </p>

                  <form (submit)="submit($event)" class="space-y-4 mt-2">
                    <ui-field label="Destinatarios" [field]="form.type">
                      <select uiSelect id="audience" [formField]="form.type">
                        <option value="CLASS_GROUP">Grupo de clase</option>
                        <option value="SCHOOL_WIDE">Toda la institución</option>
                      </select>
                    </ui-field>

                    @if (form.type().value() === 'CLASS_GROUP') {
                      <ui-field
                        label="Grupo"
                        [field]="form.classGroupId"
                        [hint]="
                          !audiences.isLoading() && audiences.value().classGroups.length === 0
                            ? 'No hay grupos disponibles. Solo puedes enviar a los grupos relacionados con tus cursos.'
                            : undefined
                        "
                      >
                        <select uiSelect id="class-group" [formField]="form.classGroupId">
                          <option [value]="''" disabled>Selecciona un grupo…</option>
                          @for (cg of audiences.value().classGroups; track cg.id) {
                            <option [value]="cg.id">{{ cg.name }}</option>
                          }
                        </select>
                      </ui-field>
                    }

                    <ui-field label="Asunto" [field]="form.title">
                      <input uiInput id="title" [formField]="form.title" />
                    </ui-field>

                    <ui-field label="Mensaje" [field]="form.body">
                      <textarea uiInput id="body" rows="5" [formField]="form.body"></textarea>
                    </ui-field>

                    <ui-field label="Prioridad" [field]="form.urgency">
                      <select uiSelect id="urgency" [formField]="form.urgency">
                        <option value="ROUTINE">Rutina</option>
                        <option value="IMPORTANT">Importante</option>
                        <option value="EMERGENCY">Emergencia (solo en la app)</option>
                      </select>
                    </ui-field>

                    <ui-choice
                      label="Permitir respuestas"
                      hint="Si lo desactivas, las familias solo podrán leer el aviso."
                    >
                      <input
                        uiToggle
                        type="checkbox"
                        [checked]="composeAllowsReplies()"
                        (change)="setComposeReplies($event)"
                      />
                    </ui-choice>

                    @if (form.type().value() === 'SCHOOL_WIDE') {
                      <div uiAlert class="text-sm">
                        Este comunicado quedará pendiente de aprobación antes de enviarse.
                      </div>
                    }

                    <div class="flex justify-end">
                      <button
                        uiButton
                        [loading]="submitting()"
                        variant="primary"
                        type="submit"
                        [disabled]="submitting() || form().invalid()"
                      >
                        Enviar comunicado
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section uiCard>
                <div uiCardBody>
                  <h2 uiCardTitle class="text-base">Historial de envíos</h2>
                  <div class="overflow-x-auto">
                    <table uiTable [attr.aria-busy]="broadcastsResource.isLoading()">
                      <thead>
                        <tr>
                          <th>Asunto</th>
                          <th>Destino</th>
                          <th>Prioridad</th>
                          <th>Estado</th>
                          <th>Destinatarios</th>
                          <th>Respuestas</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      @switch (broadcastsList.phase()) {
                        @case ('skeleton') {
                          <tbody uiTableSkeleton [columns]="7"></tbody>
                        }
                        @case ('error') {
                          <tbody>
                            <tr uiTableError [columns]="7" (retry)="broadcastsResource.reload()"></tr>
                          </tbody>
                        }
                        @case ('ready') {
                          <tbody>
                            @for (item of sent(); track item.id) {
                              <tr>
                                <td class="font-medium">{{ item.title }}</td>
                                <td>{{ typeLabel(item.type) }}</td>
                                <td>
                                  <span uiBadge size="sm" [tone]="urgencyTone(item.urgencyDefault)">
                                    {{ urgencyLabel(item.urgencyDefault) }}
                                  </span>
                                </td>
                                <td>
                                  <span uiBadge size="sm" [tone]="statusTone(item.status)">
                                    {{ statusLabel(item.status) }}
                                  </span>
                                </td>
                                <td>{{ recipientCount(item) }}</td>
                                <td>
                                  <ui-choice label="{{ repliesLabel(item) }}" class="py-0">
                                    <input
                                      uiToggle
                                      size="sm"
                                      type="checkbox"
                                      [checked]="item.repliesAllowed !== false"
                                      (change)="toggleReplies(item, $event)"
                                    />
                                  </ui-choice>
                                </td>
                                <td>{{ item.createdAt | date: 'short' }}</td>
                              </tr>
                            } @empty {
                              <tr
                                uiTableEmpty
                                [columns]="7"
                                icon="megaphone"
                                title="Sin comunicados enviados"
                                description="Cuando apruebes o envíes un aviso aparecerá aquí."
                              ></tr>
                            }
                          </tbody>
                        }
                      }
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </ng-template>
        </div>

        <div uiTabPanel value="audit">
          <ng-template uiTabContent>
            <section uiCard>
              <div uiCardBody>
                <h2 uiCardTitle class="text-base">Registro de actividad</h2>
                <div class="overflow-x-auto">
                  <table uiTable [attr.aria-busy]="auditResource.isLoading()">
                    <thead>
                      <tr>
                        <th>Acción</th>
                        <th>Actor</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    @switch (auditList.phase()) {
                      @case ('skeleton') {
                        <tbody uiTableSkeleton [columns]="3"></tbody>
                      }
                      @case ('error') {
                        <tbody>
                          <tr uiTableError [columns]="3" (retry)="auditResource.reload()"></tr>
                        </tbody>
                      }
                      @case ('ready') {
                        <tbody>
                          @for (row of auditList.rows() ?? []; track row.id) {
                            <tr>
                              <td>{{ actionLabel(row.action) }}</td>
                              <td>{{ actorName(row) }}</td>
                              <td>{{ row.createdAt | date: 'short' }}</td>
                            </tr>
                          } @empty {
                            <tr
                              uiTableEmpty
                              [columns]="3"
                              icon="history"
                              title="Sin actividad"
                              description="Las acciones de comunicación se listan aquí."
                            ></tr>
                          }
                        </tbody>
                      }
                    }
                  </table>
                </div>
              </div>
            </section>
          </ng-template>
        </div>

        <div uiTabPanel value="settings">
          <ng-template uiTabContent>
            <div class="grid gap-6 xl:grid-cols-2">
              <section uiCard>
                <div uiCardBody>
                  <h2 uiCardTitle class="text-base">Política de aprobación</h2>
                  <p class="text-sm text-ink-muted">
                    Estas reglas se aplican a todos los comunicados de la institución.
                  </p>
                  <ul class="mt-2 space-y-3">
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Avisos a toda la institución</p>
                        <p class="text-sm text-ink-muted">Quedan en cola hasta que un admin los apruebe.</p>
                      </div>
                      <input uiToggle type="checkbox" checked disabled aria-label="Aprobación institucional activa" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Avisos a un grupo de clase</p>
                        <p class="text-sm text-ink-muted">El personal puede enviarlos de inmediato.</p>
                      </div>
                      <input
                        uiToggle
                        tone="neutral"
                        type="checkbox"
                        checked
                        disabled
                        aria-label="Envío directo a grupos activo"
                      />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Respuestas en comunicados</p>
                        <p class="text-sm text-ink-muted">
                          Se elige en cada aviso. Si se desactiva, las familias solo pueden leer.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              <section uiCard>
                <div uiCardBody>
                  <h2 uiCardTitle class="text-base">Canales de entrega</h2>
                  <p class="text-sm text-ink-muted">
                    Solo el canal en la aplicación está activo. El resto se conectará con Novu más adelante.
                  </p>
                  <ul class="mt-2 space-y-3">
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">En la aplicación</p>
                        <p class="text-sm text-ink-muted">Bandeja de padres y docentes, con avisos en vivo.</p>
                      </div>
                      <input uiToggle type="checkbox" checked disabled aria-label="Canal en la aplicación activo" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">Correo electrónico</p>
                        <p class="text-sm text-ink-muted">Pendiente de configurar el proveedor de envío.</p>
                      </div>
                      <input uiToggle tone="neutral" type="checkbox" disabled aria-label="Canal de correo inactivo" />
                    </li>
                    <li class="flex items-start justify-between gap-4">
                      <div>
                        <p class="font-medium">SMS</p>
                        <p class="text-sm text-ink-muted">Requiere consentimiento y un proveedor de SMS.</p>
                      </div>
                      <input uiToggle tone="neutral" type="checkbox" disabled aria-label="Canal SMS inactivo" />
                    </li>
                  </ul>
                </div>
              </section>

              <section uiCard class="xl:col-span-2">
                <div uiCardBody>
                  <h2 uiCardTitle class="text-base">Prioridad y horario de silencio</h2>
                  <p class="text-sm text-ink-muted">
                    Cada destinatario puede tener horario de silencio. La prioridad de emergencia lo omite, pero sigue
                    llegando solo en la aplicación.
                  </p>
                  <div class="mt-3 overflow-x-auto">
                    <table uiTable>
                      <thead>
                        <tr>
                          <th>Prioridad</th>
                          <th>Comportamiento actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span uiBadge>Rutina</span></td>
                          <td>Respeta horario de silencio. Solo canal en la app.</td>
                        </tr>
                        <tr>
                          <td><span uiBadge tone="warning">Importante</span></td>
                          <td>Respeta horario de silencio. Solo canal en la app.</td>
                        </tr>
                        <tr>
                          <td><span uiBadge tone="danger">Emergencia</span></td>
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
export default class Broadcasts {
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
    repliesAllowed: boolean;
  }>({
    type: 'CLASS_GROUP',
    classGroupId: '',
    title: '',
    body: '',
    urgency: 'ROUTINE',
    repliesAllowed: true,
  });

  readonly composeAllowsReplies = computed(() => this.formModel().repliesAllowed);

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

  readonly audiences = httpResource<BroadcastAudiences>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/communication/broadcasts/audiences',
        params: { schoolId },
      };
    },
    { defaultValue: { classGroups: [], courses: [] } },
  );

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

  /** Both lists with smooth loading: rows stay while "Actualizar" or an approval reloads them. */
  protected readonly broadcastsList = listState(this.broadcastsResource);
  protected readonly auditList = listState(this.auditResource);

  readonly pending = computed(() => (this.broadcastsList.rows() ?? []).filter((t) => t.status === 'PENDING_APPROVAL'));

  readonly sent = computed(() => (this.broadcastsList.rows() ?? []).filter((t) => t.status !== 'PENDING_APPROVAL'));

  openComposer() {
    this.selectedTab.set('sent');
  }

  reload() {
    this.refreshKey.update((n) => n + 1);
  }

  submit(event: Event) {
    event.preventDefault();
    if (this.form().invalid() || this.submitting()) return;

    const { type, classGroupId, title, body, urgency, repliesAllowed } = this.formModel();
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
        repliesAllowed,
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
            repliesAllowed: true,
          });
          this.reload();
          if (thread.status === 'PENDING_APPROVAL') {
            this.selectedTab.set('pending');
            this.#toast.showSuccess('Comunicado enviado a aprobación');
          } else {
            this.#toast.showSuccess('Comunicado enviado');
          }
        },
        error: (err: { status?: number }) => {
          this.submitting.set(false);
          this.#toast.showError(
            err?.status === 403
              ? 'Solo puedes enviar comunicados a los grupos relacionados con tus cursos'
              : 'No se pudo crear el comunicado',
          );
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

  repliesLabel(item: Thread): string {
    return item.repliesAllowed === false ? 'Sin respuestas' : 'Con respuestas';
  }

  setComposeReplies(event: Event) {
    const allowed = (event.target as HTMLInputElement).checked;
    this.formModel.update((current) => ({ ...current, repliesAllowed: allowed }));
  }

  toggleReplies(item: Thread, event: Event) {
    const allowed = (event.target as HTMLInputElement).checked;
    this.#api.updateBroadcast(item.id, { repliesAllowed: allowed }).subscribe({
      next: () => {
        this.reload();
        this.#toast.showSuccess(allowed ? 'Respuestas habilitadas' : 'Respuestas deshabilitadas');
      },
      error: () => {
        this.reload();
        this.#toast.showError('No se pudo actualizar las respuestas');
      },
    });
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

  urgencyTone(urgency: UrgencyTier): BadgeTone {
    if (urgency === 'EMERGENCY') return 'danger';
    if (urgency === 'IMPORTANT') return 'warning';
    return 'neutral';
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

  statusTone(status: string): BadgeTone {
    if (status === 'PENDING_APPROVAL') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'neutral';
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
