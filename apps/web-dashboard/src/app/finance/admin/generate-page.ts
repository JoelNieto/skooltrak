import { Button, Card, Icon, Toast, UiField, UiSelect, UiTable } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import StudentSearch from '../../admin/components/student-search';
import Store from '../../core/store';
import { apiError, FeeTargets, GenerationPreview, money, yearOptions } from '../finance.types';
import { FinanceRefresh } from './finance-shell';

type Scope = 'plan' | 'group' | 'student';

/**
 * Finanzas › Generar cargos (FR-FIN-001.6): pick a year and a study plan, class group or student,
 * preview students × concepts × installments, then confirm. Re-running only creates what is
 * missing (BR-FIN-001.5), so the preview also says how many charges already exist.
 */
@Component({
  selector: 'app-finance-generate',
  imports: [Button, Card, FormsModule, Icon, RouterLink, StudentSearch, UiField, UiSelect, UiTable],
  template: `
    <nav class="flex gap-1.5 text-sm text-ink-muted mb-4" aria-label="Ruta">
      <a class="link link-primary" routerLink="/financial-module/catalog">Catálogo</a>
      <span aria-hidden="true">/</span>
      <span class="text-ink-strong">Generar cargos</span>
    </nav>

    <section uiCard class="p-5 md:p-6 flex flex-col gap-4" aria-labelledby="generate-title">
      <h2 id="generate-title" class="type-heading-md text-ink-strong">Generar cargos</h2>
      <p class="text-sm text-ink-muted -mt-2">
        Crea los cargos de las asignaciones del año para cada estudiante activo. Volver a generar solo crea los que faltan.
      </p>
      <div class="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <ui-field label="Año">
          <select uiSelect [ngModel]="selectedYear()" (ngModelChange)="pick(+$event, scope())">
            @for (y of years(); track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </ui-field>
        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-medium text-ink-strong mb-1">Para</legend>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Para quién se generan los cargos">
            @for (s of scopes; track s.value) {
              <button
                uiButton
                type="button"
                size="sm"
                [variant]="scope() === s.value ? 'primary' : 'secondary'"
                [attr.aria-pressed]="scope() === s.value"
                (click)="pick(selectedYear(), s.value)"
              >
                {{ s.label }}
              </button>
            }
          </div>
        </fieldset>
      </div>

      @switch (scope()) {
        @case ('plan') {
          <ui-field label="Plan de estudio">
            <select uiSelect [ngModel]="targetId()" (ngModelChange)="setTarget($event)">
              <option value="" disabled>Selecciona un plan…</option>
              @for (d of targets.value()?.degrees ?? []; track d.id) {
                <optgroup [label]="d.name">
                  @for (p of d.studyPlans; track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </optgroup>
              }
            </select>
          </ui-field>
        }
        @case ('group') {
          <ui-field label="Grupo">
            <select uiSelect [ngModel]="targetId()" (ngModelChange)="setTarget($event)">
              <option value="" disabled>Selecciona un grupo…</option>
              @for (d of targets.value()?.degrees ?? []; track d.id) {
                @for (p of d.studyPlans; track p.id) {
                  @if (p.classGroups.length) {
                    <optgroup [label]="p.name">
                      @for (g of p.classGroups; track g.id) {
                        <option [value]="g.id">{{ g.name }}</option>
                      }
                    </optgroup>
                  }
                }
              }
            </select>
          </ui-field>
        }
        @case ('student') {
          <app-student-search endpoint="/api/v1/finance/students" [params]="{ schoolId: store.currentSchoolId() ?? '' }" (selected)="setTarget($event.id)" />
        }
      }

      <div class="flex justify-end">
        <button uiButton variant="secondary" [disabled]="!targetId() || loading()" (click)="loadPreview()">
          <ui-icon name="eye" /> Vista previa
        </button>
      </div>
    </section>

    @if (preview(); as p) {
      <section uiCard class="p-5 md:p-6 mt-6 flex flex-col gap-4" aria-labelledby="preview-title" data-testid="generation-preview">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="preview-title" class="type-heading-md text-ink-strong">Vista previa {{ p.year }}</h2>
          <p class="text-ink-muted">
            <span class="text-ink-strong font-semibold" data-testid="preview-new">{{ countLabel(p.newCount) }} nuevos</span>
            · {{ p.students === 1 ? '1 estudiante' : p.students + ' estudiantes' }}
            @if (p.existingCount) {
              · <span data-testid="preview-existing">{{ p.existingCount }} ya generados</span>
            }
          </p>
        </div>

        @if (!p.students) {
          <p class="text-ink-muted">No hay estudiantes activos en esta selección.</p>
        } @else if (!p.items.length) {
          <p class="text-ink-muted">No hay conceptos asignados a esta selección en {{ p.year }}. Asígnalos en el Catálogo.</p>
        } @else {
          <div class="overflow-x-auto">
            <table uiTable>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th class="text-right">Cuotas</th>
                  <th class="text-right">Estudiantes</th>
                  <th class="text-right">Cargos nuevos</th>
                  <th class="text-right">Total nuevo</th>
                </tr>
              </thead>
              <tbody>
                @for (i of p.items; track i.feeItemId) {
                  <tr data-testid="preview-item">
                    <td class="font-semibold text-ink-strong">{{ i.name }}</td>
                    <td class="text-right">{{ i.installments }}</td>
                    <td class="text-right">{{ i.students }}</td>
                    <td class="text-right">{{ i.newCount }}</td>
                    <td class="text-right font-semibold">{{ fmt(i.newTotal, p.currencyCode) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3">Total</th>
                  <th class="text-right">{{ p.newCount }}</th>
                  <th class="text-right" data-testid="preview-total">{{ fmt(p.newTotal, p.currencyCode) }}</th>
                </tr>
              </tfoot>
            </table>
          </div>

          <details class="text-sm">
            <summary class="cursor-pointer text-ink-muted">Ver por estudiante</summary>
            <div class="overflow-x-auto mt-2">
              <table uiTable>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Grupo</th>
                    <th class="text-right">Nuevos</th>
                    <th class="text-right">Ya generados</th>
                    <th class="text-right">Total nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of p.studentLines; track s.id) {
                    <tr data-testid="preview-student">
                      <td>{{ s.name }}</td>
                      <td>{{ s.classGroup ?? '—' }}</td>
                      <td class="text-right">{{ s.newCount }}</td>
                      <td class="text-right">{{ s.existingCount }}</td>
                      <td class="text-right">{{ fmt(s.newTotal, p.currencyCode) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </details>
        }

        <div class="flex justify-end gap-2">
          <a uiButton variant="ghost" routerLink="/financial-module/catalog">Cancelar</a>
          <button uiButton variant="primary" [disabled]="!p.newCount || saving()" (click)="generate()">
            Generar {{ countLabel(p.newCount) }}
          </button>
        </div>
      </section>
    }
  `,
})
export default class GeneratePage {
  /** `?year=` from the catalog. */
  readonly year = input<string>();

  private http = inject(HttpClient);
  protected store = inject(Store);
  private toast = inject(Toast);
  private refresh = inject(FinanceRefresh);

  protected readonly scopes: { value: Scope; label: string }[] = [
    { value: 'plan', label: 'Un plan de estudio' },
    { value: 'group', label: 'Un grupo' },
    { value: 'student', label: 'Un estudiante' },
  ];
  protected readonly selectedYear = signal(new Date().getFullYear());
  protected readonly scope = signal<Scope>('plan');
  protected readonly targetId = signal('');
  protected readonly preview = signal<GenerationPreview | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly targets = httpResource<FeeTargets>(() => {
    const schoolId = this.store.currentSchoolId();
    return schoolId ? { url: '/api/v1/finance/fee-targets', params: { schoolId } } : undefined;
  });
  protected readonly years = computed(() => yearOptions(this.targets.value()?.currentYear ?? new Date().getFullYear()));

  constructor() {
    effect(() => {
      const fromQuery = Number(this.year());
      const current = this.targets.value()?.currentYear;
      untracked(() => {
        if (fromQuery) this.selectedYear.set(fromQuery);
        else if (current != null) this.selectedYear.set(current);
      });
    });
  }

  /** A new year or scope clears the selection and the preview. */
  protected pick(year: number, scope: Scope) {
    if (scope !== this.scope()) this.targetId.set('');
    this.selectedYear.set(year);
    this.scope.set(scope);
    this.preview.set(null);
  }

  protected setTarget(id: string) {
    this.targetId.set(id);
    this.preview.set(null);
  }

  private body() {
    const key = { plan: 'studyPlanId', group: 'classGroupId', student: 'studentId' }[this.scope()];
    return { schoolId: this.store.currentSchoolId(), year: this.selectedYear(), [key]: this.targetId() };
  }

  protected async loadPreview() {
    if (!this.targetId()) return;
    this.loading.set(true);
    try {
      this.preview.set(await firstValueFrom(this.http.post<GenerationPreview>('/api/v1/finance/charges/generate/preview', this.body())));
    } catch (err) {
      this.preview.set(null);
      this.toast.showError(apiError(err, 'No se pudo calcular la vista previa'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async generate() {
    this.saving.set(true);
    try {
      const result = await firstValueFrom(this.http.post<{ created: number }>('/api/v1/finance/charges/generate', this.body()));
      this.toast.showSuccess(result.created === 1 ? '1 cargo creado' : `${result.created} cargos creados`);
      this.refresh.bump();
      await this.loadPreview();
    } catch (err) {
      this.toast.showError(apiError(err, 'No se pudieron generar los cargos'));
    } finally {
      this.saving.set(false);
    }
  }

  protected countLabel(n: number) {
    return n === 1 ? '1 cargo' : `${n} cargos`;
  }

  protected fmt(amount: number, currency: string) {
    return money(amount, currency);
  }
}
