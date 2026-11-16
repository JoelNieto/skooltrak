import { Component, computed, input, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { Badge, BadgeTone } from '../components/badge';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { UiCheckbox, UiChoice, UiField, UiInputGroup, UiSelect } from '../components/field';
import { UiFilterMenu } from '../components/filter-menu';
import { Icon } from '../components/icon';
import { UiRowAction, UiRowActions } from '../components/row-actions';
import { UiSortHeader, UiTable, UiTableSort } from '../components/table';
import { UiTableEmpty, UiTableError, UiTableSkeleton } from '../components/table-states';
import { UiFilterChip, UiTableToolbar } from '../components/table-toolbar';

type Status = 'Al día' | 'Pendiente' | 'En riesgo';
interface Student {
  name: string;
  group: string;
  average: number;
  status: Status;
}

const STUDENTS: Student[] = [
  { name: 'María González', group: '7° A', average: 4.6, status: 'Al día' },
  { name: 'Juan Pérez', group: '7° A', average: 3.4, status: 'Pendiente' },
  { name: 'Camila Ortiz', group: '7° B', average: 2.8, status: 'En riesgo' },
  { name: 'Andrés Rojas', group: '7° B', average: 4.1, status: 'Al día' },
  { name: 'Valentina Castillo', group: '7° A', average: 3.9, status: 'Al día' },
  { name: 'Santiago Herrera', group: '7° C', average: 3.1, status: 'Pendiente' },
  { name: 'Isabella Moreno', group: '7° C', average: 4.8, status: 'Al día' },
  { name: 'Mateo Ramírez', group: '7° B', average: 2.6, status: 'En riesgo' },
  { name: 'Sofía Delgado', group: '7° A', average: 4.3, status: 'Al día' },
  { name: 'Daniel Vargas', group: '7° C', average: 3.6, status: 'Pendiente' },
];
const TONE: Record<Status, BadgeTone> = { 'Al día': 'success', Pendiente: 'warning', 'En riesgo': 'danger' };
const ACTIONS: UiRowAction[] = [
  { id: 'view', label: 'Ver perfil', icon: 'eye' },
  { id: 'message', label: 'Escribir a la familia', icon: 'mail' },
  { id: 'edit', label: 'Editar', icon: 'pencil' },
  { id: 'remove', label: 'Quitar del grupo', icon: 'trash-2', tone: 'danger' },
];

type DemoState = 'ready' | 'loading' | 'error' | 'empty';

/**
 * Reference composition: toolbar (search, filters, active-filter chips, result count, main action),
 * sortable headers, row actions and the loading / error / empty / no-results states.
 */
@Component({
  selector: 'ui-data-table-demo',
  imports: [
    Badge,
    Button,
    Card,
    FormsModule,
    Icon,
    UiCheckbox,
    UiChoice,
    UiField,
    UiFilterChip,
    UiFilterMenu,
    UiInputGroup,
    UiRowActions,
    UiSelect,
    UiSortHeader,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
  ],
  template: `
    <div class="flex max-w-4xl flex-col gap-4">
      <ui-table-toolbar label="Filtrar estudiantes">
        <label uiInputGroup size="sm">
          <ui-icon name="search" class="text-base text-ink-subtle" />
          <input type="search" placeholder="Buscar estudiante" aria-label="Buscar estudiante" [(ngModel)]="query" />
        </label>
        <ui-filter-menu [activeCount]="activeCount()" (clear)="clearFilters()">
          <fieldset>
            <legend>Grupo</legend>
            @for (g of groups; track g) {
              <ui-choice [label]="g">
                <input
                  type="checkbox"
                  uiCheckbox
                  [checked]="selectedGroups().includes(g)"
                  (change)="toggle(selectedGroups, g)"
                />
              </ui-choice>
            }
          </fieldset>
          <fieldset>
            <legend>Estado</legend>
            @for (st of statuses; track st) {
              <ui-choice [label]="st">
                <input
                  type="checkbox"
                  uiCheckbox
                  [checked]="selectedStatuses().includes(st)"
                  (change)="toggle(selectedStatuses, st)"
                />
              </ui-choice>
            }
          </fieldset>
          <ui-field label="Promedio">
            <select uiSelect [(ngModel)]="band">
              @for (b of bands; track b.value) {
                <option [value]="b.value">{{ b.label }}</option>
              }
            </select>
          </ui-field>
        </ui-filter-menu>
        <span uiToolbarEnd class="text-sm text-ink-muted tabular-nums" aria-live="polite">
          {{ visible().length }} de {{ total() }}
        </span>
        <button uiToolbarEnd uiButton variant="primary" size="sm" type="button">
          <ui-icon name="plus" class="text-base" />Agregar estudiante
        </button>
        @if (hasFilters()) {
          <ng-container uiToolbarChips>
            @if (query()) {
              <ui-filter-chip [label]="'Búsqueda: ' + query()" (remove)="query.set('')" />
            }
            @for (g of selectedGroups(); track g) {
              <ui-filter-chip [label]="'Grupo: ' + g" (remove)="toggle(selectedGroups, g)" />
            }
            @for (st of selectedStatuses(); track st) {
              <ui-filter-chip [label]="'Estado: ' + st" (remove)="toggle(selectedStatuses, st)" />
            }
            @if (band()) {
              <ui-filter-chip [label]="'Promedio: ' + bandLabel()" (remove)="band.set('')" />
            }
            <button uiButton variant="ghost" size="sm" type="button" (click)="clear()">Limpiar filtros</button>
          </ng-container>
        }
      </ui-table-toolbar>

      <div uiCard class="overflow-x-auto">
        <table uiTable rowHover [(sort)]="sort" [attr.aria-busy]="state() === 'loading'">
          <thead>
            <tr>
              <th uiSortHeader="name">Estudiante</th>
              <th uiSortHeader="group">Grupo</th>
              <th uiSortHeader="average" class="text-right">Promedio</th>
              <th>Estado</th>
              <th class="w-12"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @if (state() === 'loading') {
            <tbody uiTableSkeleton [columns]="5"></tbody>
          } @else if (state() === 'error') {
            <tbody>
              <tr uiTableError [columns]="5"></tr>
            </tbody>
          } @else {
            <tbody>
              @for (s of visible(); track s.name) {
                <tr>
                  <td>{{ s.name }}</td>
                  <td>{{ s.group }}</td>
                  <td class="text-right tabular-nums">{{ s.average.toFixed(1) }}</td>
                  <td>
                    <span uiBadge size="sm" [tone]="tone[s.status]">{{ s.status }}</span>
                  </td>
                  <td class="text-right">
                    <ui-row-actions
                      [actions]="actions"
                      [label]="'Acciones para ' + s.name"
                      (action)="last.set($event + ' · ' + s.name)"
                    />
                  </td>
                </tr>
              } @empty {
                @if (total() === 0) {
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="users"
                    title="Aún no hay estudiantes en este grupo"
                    description="Importa la lista desde un CSV o agrégalos uno por uno."
                  >
                    <button uiButton size="sm" variant="primary" type="button">Agregar estudiante</button>
                  </tr>
                } @else {
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún estudiante coincide con estos filtros."
                  >
                    <button uiButton size="sm" type="button" (click)="clear()">Limpiar filtros</button>
                  </tr>
                }
              }
            </tbody>
          }
        </table>
      </div>
      <p class="text-sm text-ink-muted" aria-live="polite">Última acción: {{ last() || '—' }}</p>
    </div>
  `,
})
class DataTableDemo {
  readonly state = input<DemoState>('ready');

  protected readonly groups = ['7° A', '7° B', '7° C'];
  protected readonly statuses: Status[] = ['Al día', 'Pendiente', 'En riesgo'];
  protected readonly tone = TONE;
  protected readonly actions = ACTIONS;

  protected readonly query = signal('');
  protected readonly selectedGroups = signal<string[]>([]);
  protected readonly selectedStatuses = signal<Status[]>([]);
  protected readonly band = signal('');
  protected readonly bands = [
    { value: '', label: 'Cualquiera', min: 0, max: 5.1 },
    { value: 'low', label: 'Menos de 3.0', min: 0, max: 3 },
    { value: 'mid', label: '3.0 a 3.9', min: 3, max: 4 },
    { value: 'high', label: '4.0 o más', min: 4, max: 5.1 },
  ];
  protected readonly sort = signal<UiTableSort | null>({ active: 'name', direction: 'asc' });
  protected readonly last = signal('');

  private readonly rows = computed(() => (this.state() === 'empty' ? [] : STUDENTS));
  protected readonly total = computed(() => this.rows().length);
  /** Filters in the menu (search is outside it). */
  protected readonly activeCount = computed(
    () => this.selectedGroups().length + this.selectedStatuses().length + (this.band() ? 1 : 0),
  );
  protected readonly hasFilters = computed(() => !!this.query() || this.activeCount() > 0);
  protected readonly bandLabel = computed(() => this.bands.find((b) => b.value === this.band())?.label ?? '');

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLocaleLowerCase('es');
    const groups = this.selectedGroups();
    const statuses = this.selectedStatuses();
    const band = this.bands.find((b) => b.value === this.band()) ?? this.bands[0];
    const filtered = this.rows().filter(
      (s) =>
        (!q || s.name.toLocaleLowerCase('es').includes(q)) &&
        (!groups.length || groups.includes(s.group)) &&
        (!statuses.length || statuses.includes(s.status)) &&
        s.average >= band.min &&
        s.average < band.max,
    );
    const sort = this.sort();
    if (!sort) return filtered;
    const key = sort.active as keyof Student;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
  });

  protected toggle<T>(list: WritableSignal<T[]>, value: T): void {
    list.update((values) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
  }

  /** The menu's "Limpiar": its filters only. */
  protected clearFilters(): void {
    this.selectedGroups.set([]);
    this.selectedStatuses.set([]);
    this.band.set('');
  }

  /** "Limpiar filtros" and the no-results button: search too. */
  protected clear(): void {
    this.query.set('');
    this.clearFilters();
  }
}

const meta: Meta<DataTableDemo> = {
  title: 'Patterns/Data table',
  component: DataTableDemo,
  argTypes: { state: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty'] } },
  args: { state: 'ready' },
};

export default meta;
type Story = StoryObj<DataTableDemo>;

/** Search, filter (chips show what's active), sort and act on rows. Filter to nothing to see "no results". */
export const Interactive: Story = {};
export const Loading: Story = { args: { state: 'loading' } };
export const LoadFailed: Story = { args: { state: 'error' } };
export const NoStudentsYet: Story = { args: { state: 'empty' } };
