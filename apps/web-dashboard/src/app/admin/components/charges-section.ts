import {
  Badge,
  BadgeTone,
  Button,
  Card,
  Confirmation,
  Icon,
  listState,
  Pagination,
  Paginator,
  Toast,
  UiField,
  UiFilterChip,
  UiFilterMenu,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
} from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import Store from '../../core/store';
import Auth from '../../auth/auth';

type ChargeType = {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  chargeType: string;
  status: string;
  student: { id: string; firstName: string; fatherName: string };
  studyPlan?: { id: string; name: string } | null;
};

type StudentOption = { id: string; firstName: string; fatherName: string };

@Component({
  selector: 'app-charges-section',
  imports: [
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
    UiFilterMenu,
    UiFilterChip,
    UiRowActions,
    UiInputGroup,
    Badge,
    UiSelect,
    Button,
    DatePipe,
    DecimalPipe,
    FormsModule,
    Paginator,
    UiField,
    Icon,
  ],
  providers: [Pagination],
  template: `
    <ui-table-toolbar label="Filtrar cargos">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input
          aria-label="Buscar descripción"
          class="pl-0"
          type="search"
          placeholder="Buscar descripción..."
          [ngModel]="pagination.search()"
          (ngModelChange)="pagination.updateSearch($event)"
        />
      </label>
      <ui-filter-menu [activeCount]="activeFilterCount()" (clear)="clearMenuFilters()">
        <ui-field label="Estado">
          <select uiSelect [ngModel]="statusFilter()" (ngModelChange)="onFilterChange('status', $event)">
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PAID">PAID</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </ui-field>
        <ui-field label="Tipo">
          <select uiSelect [ngModel]="typeFilter()" (ngModelChange)="onFilterChange('type', $event)">
            <option value="">Todos</option>
            <option value="CUSTOM">CUSTOM</option>
            <option value="TUITION">TUITION</option>
            <option value="ENROLLMENT">ENROLLMENT</option>
          </select>
        </ui-field>
        @if (showStudentFilter()) {
          <ui-field label="Estudiante">
            <select uiSelect [ngModel]="studentFilter()" (ngModelChange)="onFilterChange('student', $event)">
              <option value="">Todos</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </ui-field>
        }
      </ui-filter-menu>
      @if (activeFilterCount()) {
        <ng-container uiToolbarChips>
          @if (statusFilter()) {
            <ui-filter-chip [label]="'Estado: ' + statusFilter()" (remove)="onFilterChange('status', '')" />
          }
          @if (typeFilter()) {
            <ui-filter-chip [label]="'Tipo: ' + typeFilter()" (remove)="onFilterChange('type', '')" />
          }
          @if (studentFilter()) {
            <ui-filter-chip [label]="'Estudiante: ' + selectedStudentName()" (remove)="onFilterChange('student', '')" />
          }
        </ng-container>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="chargesResource.isLoading()">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            @if (!isStudent()) {
              <th class="w-12"><span class="sr-only">Acciones</span></th>
            }
          </tr>
        </thead>
        @switch (chargesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pagination.take()" [columns]="columns()"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="columns()" (retry)="chargesResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (c of chargesList.rows()?.data ?? []; track c.id) {
                <tr>
                  <td>{{ c.student.firstName }} {{ c.student.fatherName }}</td>
                  <td>{{ c.description || '-' }}</td>
                  <td>
                    <span uiBadge>{{ c.chargeType }}</span>
                  </td>
                  <td>{{ c.amount | number: '1.2-2' }}</td>
                  <td>{{ c.dueDate | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <span uiBadge [tone]="statusTone(c.status)">{{ c.status }}</span>
                  </td>
                  @if (!isStudent()) {
                    <td>
                      <ui-row-actions
                        [actions]="rowActions"
                        [label]="'Acciones para el cargo de ' + c.student.firstName + ' ' + c.student.fatherName"
                        (action)="onRowAction($event, c)"
                      />
                    </td>
                  }
                </tr>
              } @empty {
                @if (filtered()) {
                  <tr
                    uiTableEmpty
                    [columns]="columns()"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún cargo coincide con los filtros aplicados."
                  >
                    <button uiButton variant="ghost" size="sm" (click)="clearFilters()">Limpiar filtros</button>
                  </tr>
                } @else {
                  <tr uiTableEmpty [columns]="columns()" icon="receipt" title="Aún no hay cargos este año"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      @if (pagination.count()) {
        <div class="p-4">
          <lib-paginator
            [take]="pagination.take()"
            [skip]="pagination.skip()"
            [count]="pagination.count()"
            (skipChange)="pagination.updateSkip($event)"
            (takeChange)="pagination.updateTake($event)"
          />
        </div>
      }
    </div>
  `,
})
export default class ChargesSection {
  private http = inject(HttpClient);
  private store = inject(Store);
  private auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);
  public pagination = inject(Pagination);

  public year = input<number>(new Date().getFullYear());
  public reloadToken = input<number>(0);

  public statusFilter = signal('');
  public typeFilter = signal('');
  public studentFilter = signal('');

  public isStudent = this.auth.isStudent;
  public showStudentFilter = computed(() => !this.isStudent());

  public students = httpResource<StudentOption[]>(() => {
    if (!this.showStudentFilter()) return undefined;
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: `/api/v1/students/by-school/${schoolId}` };
  });

  public chargesResource = httpResource<{ data: ChargeType[]; total: number }>(
    () => {
      const year = this.year();
      const skip = this.pagination.skip();
      const take = this.pagination.take();
      const search = this.pagination.search();
      const status = this.statusFilter();
      const chargeType = this.typeFilter();
      const studentId = this.studentFilter();
      const reload = this.reloadToken();

      if (this.isStudent()) {
        return {
          url: '/api/v1/financial/charges/student',
          params: toFetchQueryRecord({
            year,
            status,
            chargeType,
            description: search,
            skip,
            take,
            reloadToken: reload,
          }),
        };
      }

      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/financial/charges/by-school',
        params: toFetchQueryRecord({
          schoolId,
          year,
          status,
          chargeType,
          studentId: studentId || undefined,
          description: search,
          skip,
          take,
          reloadToken: reload,
        }),
      };
    },
    { defaultValue: { data: [], total: 0 } },
  );

  /** charges with smooth loading: rows stay while the next page / filter loads. */
  protected readonly chargesList = listState(this.chargesResource);

  /** Students don't get the actions column. */
  protected readonly columns = computed(() => (this.isStudent() ? 6 : 7));

  protected readonly activeFilterCount = computed(
    () => [this.statusFilter(), this.typeFilter(), this.studentFilter()].filter(Boolean).length,
  );
  protected readonly filtered = computed(() => this.activeFilterCount() > 0 || !!this.pagination.search());

  protected readonly selectedStudentName = computed(() => {
    const s = this.students.value()?.find((st) => st.id === this.studentFilter());
    return s ? `${s.firstName} ${s.fatherName}` : '';
  });

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [{ id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' }];

  protected onRowAction(action: string, charge: ChargeType): void {
    if (action === 'delete') this.removeCharge(charge.id);
  }

  constructor() {
    this.pagination.updateTake(10);
    effect(() => {
      const value = this.chargesResource.value();
      if (value) {
        this.pagination.updateCount(value.total);
      }
    });
  }

  public onFilterChange(kind: 'status' | 'type' | 'student', value: string) {
    if (kind === 'status') this.statusFilter.set(value);
    else if (kind === 'type') this.typeFilter.set(value);
    else this.studentFilter.set(value);
    this.pagination.updateSkip(0);
  }

  protected clearMenuFilters() {
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.studentFilter.set('');
    this.pagination.updateSkip(0);
  }

  protected clearFilters() {
    this.pagination.updateSearch('');
    this.clearMenuFilters();
  }

  statusTone(status: string): BadgeTone {
    const m: Record<string, BadgeTone> = {
      PENDING: 'warning',
      PAID: 'success',
      PARTIAL: 'info',
      OVERDUE: 'danger',
    };
    return m[status] ?? 'neutral';
  }

  removeCharge(id: string) {
    this.confirmation
      .confirm({ title: 'Eliminar cargo', message: '¿Estás seguro de eliminar este cargo?' })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.http.delete(`/api/v1/financial/charges/${id}`).subscribe({
          next: () => {
            this.toast.showSuccess('Cargo eliminado');
            this.chargesResource.reload();
          },
          error: (e) => this.toast.showError(e?.message ?? 'Error'),
        });
      });
  }
}
