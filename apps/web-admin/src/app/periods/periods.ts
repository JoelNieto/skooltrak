import {
  Badge,
  Breadcrumbs,
  Button,
  Confirmation,
  Icon,
  Modal,
  Toast,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { Prisma } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import PeriodsForm from './periods-form';

type PeriodRow = Prisma.PeriodGetPayload<{ include: undefined }>;

interface CustomSchoolsYear {
  year: number;
  schools: { id: string; name: string }[];
}

interface YearGroup {
  year: number;
  periods: PeriodRow[];
  first: Date | string | null;
  last: Date | string | null;
  /** Schools that use their own periods this year. */
  customSchools: { id: string; name: string }[];
  customSchoolNames: string;
}

@Component({
  selector: 'app-periods',
  imports: [Badge, Breadcrumbs, UiTable, Button, DatePipe, Icon, UiRowActions, UiTableEmpty, UiTableError, UiTableSkeleton],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Periodos' }]" />
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl text-ink-strong font-medium">Periodos</h1>
        <p class="text-sm text-ink-muted">
          Periodos globales agrupados por año. Un colegio con otro calendario (p. ej. americano) puede usar
          sus propios periodos desde su panel.
        </p>
      </div>
      <button uiButton variant="primary" (click)="editPeriod()">
        <ui-icon name="circle-plus" />
        Nuevo periodo
      </button>
    </div>
    @switch (periodsList.phase()) {
      @case ('skeleton') {
        <table uiTable aria-busy="true">
          <tbody uiTableSkeleton [columns]="5"></tbody>
        </table>
      }
      @case ('error') {
        <table uiTable>
          <tbody>
            <tr uiTableError [columns]="5" (retry)="periods.reload()"></tr>
          </tbody>
        </table>
      }
      @case ('ready') {
        @for (group of years(); track group.year) {
          <section class="mb-6" [attr.aria-labelledby]="'year-' + group.year">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 [id]="'year-' + group.year" class="text-lg font-medium text-ink-strong">
                {{ group.year }}
                <span class="text-sm font-normal text-ink-muted">
                  · {{ group.periods.length }} {{ group.periods.length === 1 ? 'periodo' : 'periodos' }}
                  @if (group.first && group.last) {
                    · {{ group.first | date: 'dd/MM/yyyy' : 'UTC' }} – {{ group.last | date: 'dd/MM/yyyy' : 'UTC' }}
                  }
                </span>
              </h2>
              @if (group.customSchools.length) {
                <span
                  uiBadge
                  tone="warning"
                  size="sm"
                  [title]="'Usan periodos propios: ' + group.customSchoolNames"
                >
                  {{ group.customSchools.length }}
                  {{ group.customSchools.length === 1 ? 'colegio usa' : 'colegios usan' }} periodos propios
                </span>
              }
              <button uiButton variant="ghost" size="sm" class="ms-auto" (click)="editPeriod(undefined, group.year)">
                <ui-icon name="circle-plus" />
                Agregar a {{ group.year }}
              </button>
            </div>
            <div class="overflow-x-auto">
              <table uiTable [attr.aria-busy]="periods.isLoading()">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Nombre corto</th>
                    <th>Fecha de inicio</th>
                    <th>Fecha de fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (period of group.periods; track period.id) {
                    <tr>
                      <td>{{ period.name }}</td>
                      <td>{{ period.shortName }}</td>
                      <td>{{ period.startDate | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                      <td>{{ period.endDate | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                      <td class="flex gap-2">
                        <ui-row-actions
                          [actions]="rowActions"
                          [label]="'Acciones para ' + period.name"
                          (action)="onRowAction($event, period)"
                        />
                      </td>
                    </tr>
                  } @empty {
                    <tr uiTableEmpty [columns]="5" icon="calendar" title="Sin periodos globales este año"></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        } @empty {
          <table uiTable>
            <tbody>
              <tr uiTableEmpty [columns]="5" icon="calendar" title="Aún no hay periodos"></tr>
            </tbody>
          </table>
        }
      }
    }
  `,
})
export default class Periods {
  private http = inject(HttpClient);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  public periods = httpResource<PeriodRow[]>(() => '/api/v1/periods', {
    defaultValue: [],
  });
  /** periods with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly periodsList = listState(this.periods);

  /** Per year, the schools on their own calendar. */
  public customSchools = httpResource<CustomSchoolsYear[]>(() => '/api/v1/periods/custom-schools', {
    defaultValue: [],
  });

  /**
   * Global periods grouped by year, newest year first; each year's periods by start date. A year
   * where only schools have their own periods still shows, empty.
   */
  protected readonly years = computed<YearGroup[]>(() => {
    const groups = new Map<number, PeriodRow[]>();
    for (const p of this.periodsList.rows() ?? []) groups.set(p.year, [...(groups.get(p.year) ?? []), p]);
    const custom = new Map((this.customSchools.value() ?? []).map((c) => [c.year, c.schools]));
    for (const year of custom.keys()) if (!groups.has(year)) groups.set(year, []);
    const time = (d: Date | string) => new Date(d).getTime();
    return [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, periods]) => {
        const sorted = [...periods].sort((a, b) => time(a.startDate) - time(b.startDate));
        const last = sorted.reduce<PeriodRow | null>((m, p) => (!m || time(p.endDate) > time(m.endDate) ? p : m), null);
        const schools = custom.get(year) ?? [];
        return {
          year,
          periods: sorted,
          first: sorted[0]?.startDate ?? null,
          last: last?.endDate ?? null,
          customSchools: schools,
          customSchoolNames: schools.map((x) => x.name).join(', '),
        };
      });
  });

  editPeriod(period?: PeriodRow, year?: number) {
    this.modal
      .open(PeriodsForm, {
        title: period ? 'Editar Periodo' : year ? `Nuevo periodo ${year}` : 'Nuevo Periodo',
        data: { period, year },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.periods.reload();
        }
      });
  }

  deletePeriod(period: PeriodRow) {
    this.confirmation
      .confirm({
        title: 'Eliminar Periodo',
        message: `¿Estás seguro de eliminar el periodo ${period.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.http.delete(`/api/v1/periods/${period.id}`)),
      )
      .subscribe({
        next: () => {
          this.periods.reload();
          this.toast.showSuccess('Periodo eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar el periodo');
        },
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, period: PeriodRow): void {
    switch (action) {
      case 'edit':
        this.editPeriod(period);
        break;
      case 'delete':
        this.deletePeriod(period);
        break;
    }
  }
}
