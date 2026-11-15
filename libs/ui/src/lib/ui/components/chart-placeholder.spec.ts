import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChartPlaceholder } from './chart-placeholder';

@Component({
  imports: [ChartPlaceholder],
  template: `
    <ui-chart-placeholder class="bars" kind="Histograma" description="Notas por rango" source="student_grades" />
    <ui-chart-placeholder class="line" kind="Línea" description="Promedio por trimestre" shape="line" />
  `,
})
class Host {}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return (s: string) => root.querySelector(s) as HTMLElement;
}

describe('ui-chart-placeholder', () => {
  it('is announced as one image naming the future chart', () => {
    const q = setup();
    const bars = q('.bars');

    expect(bars.getAttribute('role')).toBe('img');
    expect(bars.getAttribute('aria-label')).toBe('Gráfico por desarrollar: Histograma. Notas por rango');
    expect(bars.textContent).toContain('Gráfico por desarrollar');
    expect(bars.textContent).toContain('fuente: student_grades');
  });

  it('draws a decorative skeleton for its shape and no source when none is given', () => {
    const q = setup();

    expect(q('.bars svg')).toBeNull();
    expect(q('.bars [aria-hidden="true"] div')).not.toBeNull();
    expect(q('.line svg')).not.toBeNull();
    expect(q('.line').textContent).not.toContain('fuente');
  });
});
