import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableDensity, UiTable } from './table';

@Component({
  imports: [UiTable],
  template: `
    <table uiTable class="plain w-full"></table>
    <table uiTable [density]="density()" zebra rowHover stickyHeader class="dense"></table>
  `,
})
class Host {
  density = signal<TableDensity>('compact');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, q: (s: string) => root.querySelector(s) as HTMLElement };
}

describe('uiTable', () => {
  it('is a comfortable table with no extras by default, keeping host classes', () => {
    const { q } = setup();
    const t = q('.plain');
    expect([...t.classList]).toEqual(expect.arrayContaining(['table', 'ui-table', 'w-full']));
    for (const c of ['table-sm', 'table-zebra', 'table-pin-rows', 'ui-table-row-hover'])
      expect(t.classList).not.toContain(c);
  });

  it('maps density, zebra, rowHover and stickyHeader', () => {
    const { fixture, host, q } = setup();
    const t = q('.dense');
    expect([...t.classList]).toEqual(
      expect.arrayContaining(['table-sm', 'table-zebra', 'table-pin-rows', 'ui-table-row-hover']),
    );
    host.density.set('comfortable');
    fixture.detectChanges();
    expect(t.classList).not.toContain('table-sm');
  });
});
