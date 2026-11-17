import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiRowAction, UiRowActions } from './row-actions';
import { UiSortHeader, UiTable, UiTableSort } from './table';
import { UiTableEmpty, UiTableError, UiTableSkeleton } from './table-states';
import { UiFilterChip } from './table-toolbar';

@Component({
  imports: [UiTable, UiSortHeader, UiTableSkeleton, UiTableEmpty, UiTableError, UiFilterChip, UiRowActions],
  template: `
    <table uiTable [(sort)]="sort">
      <thead>
        <tr>
          <th uiSortHeader="name">Nombre</th>
          <th uiSortHeader="code">Código</th>
          <th>Acciones</th>
        </tr>
      </thead>
      @switch (state()) {
        @case ('loading') {
          <tbody uiTableSkeleton [columns]="3" [rows]="4"></tbody>
        }
        @case ('error') {
          <tbody>
            <tr uiTableError [columns]="3" (retry)="retries = retries + 1"></tr>
          </tbody>
        }
        @case ('empty') {
          <tbody>
            <tr uiTableEmpty [columns]="3" title="Sin resultados" icon="search-x">
              <button type="button" class="clear">Limpiar filtros</button>
            </tr>
          </tbody>
        }
        @default {
          <tbody>
            <tr>
              <td>Matemáticas</td>
              <td>MAT</td>
              <td>
                <ui-row-actions [actions]="actions" label="Acciones para Matemáticas" (action)="chosen = $event" />
              </td>
            </tr>
          </tbody>
        }
      }
    </table>
    <ui-filter-chip label="Estado: Activa" (remove)="removed = true" />
  `,
})
class Host {
  sort = signal<UiTableSort | null>(null);
  state = signal<'ready' | 'loading' | 'error' | 'empty'>('ready');
  retries = 0;
  removed = false;
  chosen = '';
  actions: UiRowAction[] = [
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    { id: 'edit', label: 'Editar', icon: 'pencil' },
  ];
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = (s: string) => root.querySelector(s) as HTMLElement;
  const qa = (s: string) => [...root.querySelectorAll(s)] as HTMLElement[];
  return { fixture, host: fixture.componentInstance, q, qa };
}

describe('table sorting', () => {
  it('sorts ascending, then toggles the direction, and sets aria-sort on the header', () => {
    const { fixture, host, qa } = setup();
    const [name, code] = qa('th.ui-sort-header');
    expect(name.getAttribute('aria-sort')).toBeNull();
    (name.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.sort()).toEqual({ active: 'name', direction: 'asc' });
    expect(name.getAttribute('aria-sort')).toBe('ascending');
    expect(name.classList).toContain('ui-sort-active');
    (name.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.sort()).toEqual({ active: 'name', direction: 'desc' });
    expect(name.getAttribute('aria-sort')).toBe('descending');
    (code.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.sort()).toEqual({ active: 'code', direction: 'asc' });
    expect(name.getAttribute('aria-sort')).toBeNull();
  });

  it('follows a sort set from outside', () => {
    const { fixture, host, qa } = setup();
    host.sort.set({ active: 'code', direction: 'desc' });
    fixture.detectChanges();
    expect(qa('th.ui-sort-header')[1].getAttribute('aria-sort')).toBe('descending');
  });
});

describe('table states', () => {
  it('loading: rows × columns of skeleton bars and one status message', () => {
    const { fixture, host, q, qa } = setup();
    host.state.set('loading');
    fixture.detectChanges();
    expect(qa('tbody.ui-table-skeleton tr')).toHaveLength(4);
    expect(qa('tbody.ui-table-skeleton tr:first-child td')).toHaveLength(3);
    expect(qa('.ui-skeleton')).toHaveLength(12);
    expect(q('[role="status"]').textContent).toContain('Cargando');
  });

  it('empty: one cell across every column, with projected actions', () => {
    const { fixture, host, q } = setup();
    host.state.set('empty');
    fixture.detectChanges();
    expect(q('td.ui-table-state-cell').getAttribute('colspan')).toBe('3');
    expect(q('.ui-table-state-title').textContent).toContain('Sin resultados');
    expect(q('.ui-table-state-actions .clear')).not.toBeNull();
  });

  it('error: an alert with a retry button', () => {
    const { fixture, host, q } = setup();
    host.state.set('error');
    fixture.detectChanges();
    expect(q('[role="alert"]').textContent).toContain('No se pudo cargar');
    (q('[role="alert"] button') as HTMLButtonElement).click();
    expect(host.retries).toBe(1);
  });
});

describe('filter chip', () => {
  it('names its remove button after the filter and emits remove', () => {
    const { host, q } = setup();
    const btn = q('.ui-filter-chip-remove');
    expect(btn.getAttribute('aria-label')).toBe('Quitar filtro: Estado: Activa');
    btn.click();
    expect(host.removed).toBe(true);
  });
});

describe('row actions', () => {
  it('labels the trigger, opens the menu with danger last, and emits the chosen id', async () => {
    const { fixture, host, q } = setup();
    const trigger = q('ui-row-actions button');
    expect(trigger.getAttribute('aria-label')).toBe('Acciones para Matemáticas');
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // The menu renders in CDK's overlay (outside the fixture when the browser has no popover API).
    const items = [...document.querySelectorAll('.ui-menu-item')] as HTMLElement[];
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Editar', 'Eliminar']);
    expect(items[1].classList).toContain('ui-menu-item-danger');
    items[0].click();
    fixture.detectChanges();
    expect(host.chosen).toBe('edit');
  });
});
