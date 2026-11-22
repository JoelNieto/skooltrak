import { Badge, Button, EmptyState, Icon, Toast, UiInputGroup } from '#/ui';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface RosterStudent {
  id: string;
  name: string;
  initials: string;
  documentId: string;
  classGroup: { id: string; name: string } | null;
}

export interface RosterEntry {
  student: RosterStudent;
  source: 'PLAN' | 'MANUAL';
  excluded: boolean;
  addedBy: string | null;
}

/**
 * An admin manages a course's roster (ACA-001 FR .19, BR .15): who is in it and why (*Plan de
 * estudio* / *Agregado*), adding a student from the course's school (an elective) and removing one
 * (an exemption; a plan student can be restored). Closes with `true` when the roster changed.
 */
@Component({
  selector: 'app-course-roster-dialog',
  imports: [Badge, Button, EmptyState, Icon, UiInputGroup],
  template: `
    <div class="flex flex-col gap-5">
      <section aria-labelledby="roster-add" class="flex flex-col gap-2">
        <h3 id="roster-add" class="text-sm font-semibold text-ink-strong">Agregar estudiante</h3>
        <label uiInputGroup class="w-full">
          <ui-icon name="search" />
          <input
            type="search"
            placeholder="Nombre o cédula"
            aria-label="Buscar estudiante para agregar"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
          />
        </label>
        @if (search().trim().length >= 2) {
          @if (candidates.value(); as list) {
            @if (list.length) {
              <ul class="flex max-h-48 flex-col overflow-y-auto rounded-lg border border-line" aria-label="Resultados">
                @for (s of list; track s.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-b-0">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-medium text-ink-strong">{{ s.name }}</div>
                      <div class="text-xs text-ink-muted">
                        {{ s.documentId }} · {{ s.classGroup?.name ?? 'Sin grupo' }}
                      </div>
                    </div>
                    <button uiButton size="sm" variant="secondary" type="button" [disabled]="busy()" (click)="add(s)">
                      <ui-icon name="plus" />
                      Agregar
                    </button>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-xs text-ink-muted">Ningún estudiante de la escuela coincide, o ya están en el curso.</p>
            }
          }
        }
      </section>

      <section aria-labelledby="roster-list" class="flex flex-col gap-2">
        <h3 id="roster-list" class="text-sm font-semibold text-ink-strong">
          Estudiantes del curso <span class="font-normal text-ink-muted">· {{ activeCount() }}</span>
        </h3>
        @if (roster.value(); as entries) {
          @if (entries.length) {
            <ul
              class="flex max-h-80 flex-col overflow-y-auto rounded-lg border border-line"
              aria-label="Estudiantes del curso"
            >
              @for (e of entries; track e.student.id) {
                <li
                  class="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-b-0"
                  [class.opacity-60]="e.excluded"
                >
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium text-ink-strong">{{ e.student.name }}</span>
                      @if (e.excluded) {
                        <span uiBadge size="sm" tone="warning">Excluido</span>
                      } @else if (e.source === 'MANUAL') {
                        <span uiBadge size="sm" tone="action">Agregado</span>
                      } @else {
                        <span uiBadge size="sm">Plan de estudio</span>
                      }
                    </div>
                    <div class="text-xs text-ink-muted">
                      {{ e.student.classGroup?.name ?? 'Sin grupo' }}
                      @if (e.source === 'MANUAL' && e.addedBy) {
                        · agregado por {{ e.addedBy }}
                      }
                    </div>
                  </div>
                  @if (e.excluded) {
                    <button
                      uiButton
                      size="sm"
                      variant="ghost"
                      type="button"
                      [disabled]="busy()"
                      (click)="add(e.student)"
                    >
                      <ui-icon name="undo-2" />
                      Restaurar
                    </button>
                  } @else {
                    <button
                      uiButton
                      size="sm"
                      variant="ghost"
                      type="button"
                      [disabled]="busy()"
                      [attr.aria-label]="'Quitar a ' + e.student.name"
                      (click)="remove(e)"
                    >
                      <ui-icon name="x" />
                      Quitar
                    </button>
                  }
                </li>
              }
            </ul>
            <p class="text-xs text-ink-muted">
              Quitar a un estudiante conserva sus calificaciones y entregas; solo deja de verse en el curso.
            </p>
          } @else {
            <lib-empty-state icon="users" title="Sin estudiantes" description="Agrega estudiantes con la búsqueda." />
          }
        } @else if (roster.error()) {
          <p class="text-sm text-ink-muted">No se pudo cargar la lista.</p>
        }
      </section>

      <div class="flex justify-end">
        <button uiButton variant="primary" type="button" (click)="closeModal.emit(changed())">Listo</button>
      </div>
    </div>
  `,
})
export default class CourseRosterDialog {
  readonly data = input.required<{ courseId: string }>();
  readonly closeModal = output<boolean>();
  #http = inject(HttpClient);
  #toast = inject(Toast);

  protected readonly search = signal('');
  protected readonly busy = signal(false);
  protected readonly changed = signal(false);
  protected readonly url = computed(() => `/api/v1/courses/${this.data().courseId}/roster`);

  protected readonly roster = httpResource<RosterEntry[]>(() => this.url());
  protected readonly candidates = httpResource<RosterStudent[]>(() => {
    const search = this.search().trim();
    return search.length >= 2 ? { url: `${this.url()}/candidates`, params: { search } } : undefined;
  });
  protected readonly activeCount = computed(() => (this.roster.value() ?? []).filter((e) => !e.excluded).length);

  protected async add(student: RosterStudent): Promise<void> {
    await this.#run(
      () => firstValueFrom(this.#http.post(this.url(), { studentId: student.id })),
      `${student.name} está en el curso`,
    );
  }

  protected async remove(entry: RosterEntry): Promise<void> {
    await this.#run(
      () => firstValueFrom(this.#http.delete(`${this.url()}/${entry.student.id}`)),
      `${entry.student.name} ya no está en el curso`,
    );
  }

  async #run(action: () => Promise<unknown>, done: string): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.changed.set(true);
      this.roster.reload();
      this.candidates.reload();
      this.#toast.showSuccess(done);
    } catch (e) {
      const body = e instanceof HttpErrorResponse ? e.error : null;
      this.#toast.showError(typeof body?.message === 'string' ? body.message : 'No se pudo actualizar la lista');
    } finally {
      this.busy.set(false);
    }
  }
}
