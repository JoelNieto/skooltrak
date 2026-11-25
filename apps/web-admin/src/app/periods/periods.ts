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

type PeriodRow = Prisma.PeriodGetPayload<{ include: undefined }> & { _count?: { schoolOverrides: number } };

interface YearGroup {
  year: number;
  periods: PeriodRow[];
  first: Date | string | null;
  last: Date | string | null;
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
          Periodos globales agrupados por año. Cada colegio puede ajustar nombres y fechas desde su panel.
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
          <tbody uiTableSkeleton [columns]="6"></tbody>
        </table>
      }
      @case ('error') {
        <table uiTable>
          <tbody>
            <tr uiTableError [columns]="6" (retry)="periods.reload()"></tr>
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
              <button uiButton variant="ghost" size="sm" (click)="editPeriod(undefined, group.year)">
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
                    <th>Colegios con ajustes</th>
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
                      <td>
                        @if (period._count?.schoolOverrides) {
                          <span uiBadge tone="warning" size="sm">{{ period._count?.schoolOverrides }}</span>
                        } @else {
                          <span class="text-ink-subtle">—</span>
                        }
                      </td>
                      <td class="flex gap-2">
                        <ui-row-actions
                          [actions]="rowActions"
                          [label]="'Acciones para ' + period.name"
                          (action)="onRowAction($event, period)"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        } @empty {
          <table uiTable>
            <tbody>
              <tr uiTableEmpty [columns]="6" icon="calendar" title="Aún no hay periodos"></tr>
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

  /** Periods grouped by year, newest year first; each year's periods by start date. */
  protected readonly years = computed<YearGroup[]>(() => {
    const groups = new Map<number, PeriodRow[]>();
    for (const p of this.periodsList.rows() ?? []) groups.set(p.year, [...(groups.get(p.year) ?? []), p]);
    const time = (d: Date | string) => new Date(d).getTime();
    return [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, periods]) => {
        const sorted = [...periods].sort((a, b) => time(a.startDate) - time(b.startDate));
        const last = sorted.reduce<PeriodRow | null>((m, p) => (!m || time(p.endDate) > time(m.endDate) ? p : m), null);
        return { year, periods: sorted, first: sorted[0]?.startDate ?? null, last: last?.endDate ?? null };
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
