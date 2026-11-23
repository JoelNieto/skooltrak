import { Button, Card, CardBody, PageHeader, Toast, UiCheckbox, UiChoice, UiField, UiInput, UiRadio, UiSelect } from '#/ui';
import { CHANNEL_SCOPE_LABELS, CHANNEL_SCOPES, ChannelReplyVisibilityKey, ChannelScopeKey, ChannelTarget } from '@/shared';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Auth from '../auth/auth';
import Store from '../core/store';
import { CommunicationApi } from './communication-api';

const TEACHER_SCOPES: ChannelScopeKey[] = ['COURSE', 'CLASS_GROUP'];

/**
 * COM-003 FR .1–.5: create a channel (level, target, audience, replies, visibility) or edit one.
 * `?scope=COURSE&targetId=…` pre-selects the level and target (from a course or group page).
 */
@Component({
  selector: 'app-channel-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Card, CardBody, UiField, UiChoice, UiInput, UiSelect, UiCheckbox, UiRadio, Button, FormsModule],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Canales', link: '/communication/channels' }, { label: title() }]"
      [title]="title()"
    />

    <form uiCard class="max-w-2xl" (submit)="save($event)">
      <div uiCardBody class="grid gap-5">
        @if (!id()) {
          <ui-field label="Nivel" required hint="A quién se dirige el canal.">
            <select uiSelect id="scope" name="scope" [ngModel]="scope()" (ngModelChange)="setScope($event)">
              @for (s of scopes(); track s) {
                <option [value]="s">{{ scopeLabels[s] }}</option>
              }
            </select>
          </ui-field>

          @if (scope() !== 'ORGANIZATION') {
            <ui-field [label]="scopeLabels[scope()]" required>
              <select uiSelect id="target" name="target" [ngModel]="targetId()" (ngModelChange)="targetId.set($event)" [disabled]="targets.isLoading()">
                <option value="" disabled>{{ targets.isLoading() ? 'Cargando…' : 'Selecciona…' }}</option>
                @for (t of targets.value() ?? []; track t.id) {
                  <option [value]="t.id">{{ t.name }}{{ t.context ? ' · ' + t.context : '' }}</option>
                }
              </select>
            </ui-field>
          }
        }

        <ui-field label="Nombre" required>
          <input uiInput id="name" name="name" maxlength="120" [ngModel]="name()" (ngModelChange)="onName($event)" />
        </ui-field>

        <ui-field label="Descripción" optional>
          <textarea uiInput id="description" name="description" rows="2" maxlength="1000" [ngModel]="description()" (ngModelChange)="description.set($event)"></textarea>
        </ui-field>

        <fieldset class="grid gap-3">
          <legend class="type-label text-ink-strong mb-1">Audiencia</legend>
          <ui-choice label="Estudiantes">
            <input uiCheckbox type="checkbox" id="aud-students" name="audStudents" [ngModel]="audienceStudents()" (ngModelChange)="audienceStudents.set($event)" />
          </ui-choice>
          <ui-choice label="Acudientes" hint="Los padres o acudientes de esos estudiantes.">
            <input uiCheckbox type="checkbox" id="aud-parents" name="audParents" [ngModel]="audienceParents()" (ngModelChange)="audienceParents.set($event)" />
          </ui-choice>
        </fieldset>

        <fieldset class="grid gap-3">
          <legend class="type-label text-ink-strong mb-1">Respuestas</legend>
          <ui-choice label="Los estudiantes pueden responder">
            <input uiCheckbox type="checkbox" id="reply-students" name="replyStudents" [disabled]="!audienceStudents()" [ngModel]="studentsCanReply() && audienceStudents()" (ngModelChange)="studentsCanReply.set($event)" />
          </ui-choice>
          <ui-choice label="Los acudientes pueden responder">
            <input uiCheckbox type="checkbox" id="reply-parents" name="replyParents" [disabled]="!audienceParents()" [ngModel]="parentsCanReply() && audienceParents()" (ngModelChange)="parentsCanReply.set($event)" />
          </ui-choice>
        </fieldset>

        @if (anyReplies()) {
          <fieldset class="grid gap-3">
            <legend class="type-label text-ink-strong mb-1">¿Quién ve las respuestas?</legend>
            <ui-choice label="Privadas" hint="Cada respuesta solo la ven quien la escribe y los administradores del canal.">
              <input uiRadio type="radio" id="vis-private" name="visibility" value="PRIVATE" [ngModel]="visibility()" (ngModelChange)="visibility.set($event)" />
            </ui-choice>
            <ui-choice label="Públicas" hint="Todos los miembros del canal ven todas las respuestas.">
              <input uiRadio type="radio" id="vis-public" name="visibility" value="PUBLIC" [ngModel]="visibility()" (ngModelChange)="visibility.set($event)" />
            </ui-choice>
          </fieldset>
        }

        @if (error()) {
          <p class="text-sm text-error" role="alert">{{ error() }}</p>
        }

        <div class="flex flex-wrap justify-end gap-2">
          @if (id()) {
            <button uiButton variant="ghost" type="button" (click)="toggleArchive()" [disabled]="saving()">
              {{ archived() ? 'Reabrir canal' : 'Archivar canal' }}
            </button>
          }
          <button uiButton variant="secondary" type="button" (click)="cancel()">Cancelar</button>
          <button uiButton variant="primary" type="submit" [disabled]="!valid() || saving()" [loading]="saving()">
            {{ id() ? 'Guardar' : 'Crear canal' }}
          </button>
        </div>
      </div>
    </form>
  `,
})
export default class ChannelForm {
  #api = inject(CommunicationApi);
  #auth = inject(Auth);
  #store = inject(Store);
  #router = inject(Router);
  #route = inject(ActivatedRoute);
  #toast = inject(Toast);

  /** Route param on /communication/channels/:id/edit. */
  readonly id = input<string>();

  readonly scopeLabels = CHANNEL_SCOPE_LABELS;
  readonly scopes = computed<ChannelScopeKey[]>(() =>
    this.#auth.isTeacher() ? TEACHER_SCOPES : [...CHANNEL_SCOPES],
  );

  readonly scope = signal<ChannelScopeKey>('COURSE');
  readonly targetId = signal('');
  readonly name = signal('');
  readonly description = signal('');
  readonly audienceStudents = signal(true);
  readonly audienceParents = signal(true);
  readonly studentsCanReply = signal(false);
  readonly parentsCanReply = signal(false);
  readonly visibility = signal<ChannelReplyVisibilityKey>('PRIVATE');
  readonly archived = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly title = computed(() => (this.id() ? 'Editar canal' : 'Nuevo canal'));
  readonly anyReplies = computed(
    () => (this.audienceStudents() && this.studentsCanReply()) || (this.audienceParents() && this.parentsCanReply()),
  );
  readonly valid = computed(
    () =>
      !!this.name().trim() &&
      (this.audienceStudents() || this.audienceParents()) &&
      (!!this.id() || this.scope() === 'ORGANIZATION' || !!this.targetId()),
  );

  readonly targets = resource({
    params: () => (this.id() || this.scope() === 'ORGANIZATION' ? undefined : { scope: this.scope(), school: this.#store.currentSchool()?.id }),
    loader: ({ params }): Promise<ChannelTarget[]> => this.#api.targets(params.scope, params.school),
  });

  constructor() {
    const query = this.#route.snapshot.queryParamMap;
    const presetScope = query.get('scope') as ChannelScopeKey | null;
    if (presetScope && (CHANNEL_SCOPES as readonly string[]).includes(presetScope)) this.scope.set(presetScope);
    if (query.get('targetId')) this.targetId.set(query.get('targetId') ?? '');

    // A teacher only has course and group levels.
    effect(() => {
      if (!this.id() && !this.scopes().includes(this.scope())) this.scope.set(this.scopes()[0]);
    });
    // Default the name to the target's, until the user types one.
    effect(() => {
      const target = (this.targets.value() ?? []).find((t) => t.id === this.targetId());
      if (target && !this.#nameTouched) this.name.set(target.name);
    });
    // Editing: load the current settings.
    effect(() => {
      const id = this.id();
      if (id) void this.#load(id);
    });
  }

  #nameTouched = false;

  /** Typing a name stops the target's name from replacing it. */
  onName(value: string) {
    this.name.set(value);
    this.#nameTouched = true;
  }

  setScope(scope: ChannelScopeKey) {
    this.scope.set(scope);
    this.targetId.set('');
  }

  async #load(id: string) {
    try {
      const c = await this.#api.channel(id);
      this.#nameTouched = true;
      this.scope.set(c.scope);
      this.name.set(c.name);
      this.description.set(c.description);
      this.audienceStudents.set(c.audienceStudents);
      this.audienceParents.set(c.audienceParents);
      this.studentsCanReply.set(c.studentsCanReply);
      this.parentsCanReply.set(c.parentsCanReply);
      this.visibility.set(c.replyVisibility);
      this.archived.set(c.archived);
    } catch {
      this.error.set('No se pudo cargar el canal');
    }
  }

  async save(event: Event) {
    event.preventDefault();
    if (!this.valid() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const settings = {
      name: this.name().trim(),
      description: this.description().trim(),
      audienceStudents: this.audienceStudents(),
      audienceParents: this.audienceParents(),
      studentsCanReply: this.audienceStudents() && this.studentsCanReply(),
      parentsCanReply: this.audienceParents() && this.parentsCanReply(),
      replyVisibility: this.visibility(),
    };
    try {
      const id = this.id();
      const saved = id
        ? await this.#api.updateChannel(id, settings)
        : await this.#api.createChannel({
            ...settings,
            scope: this.scope(),
            ...(this.scope() === 'ORGANIZATION' ? {} : { targetId: this.targetId() }),
          });
      this.#toast.showSuccess(id ? 'Canal actualizado' : 'Canal creado');
      this.#router.navigate(['/communication/channels', saved.id]);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleArchive() {
    const id = this.id();
    if (!id) return;
    this.saving.set(true);
    try {
      const saved = await this.#api.updateChannel(id, { archived: !this.archived() });
      this.archived.set(saved.archived);
      this.#toast.showSuccess(saved.archived ? 'Canal archivado' : 'Canal reabierto');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    const id = this.id();
    this.#router.navigate(id ? ['/communication/channels', id] : ['/communication/channels']);
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const message = (e.error as { message?: string | string[] } | null)?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return 'Algo salió mal. Inténtalo de nuevo.';
}
