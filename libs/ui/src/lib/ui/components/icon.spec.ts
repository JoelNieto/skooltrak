import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UI_ICONS, UiIconName } from '../icons/icons';
import { Icon } from './icon';

@Component({
  imports: [Icon],
  template: `
    <ui-icon name="trash-2" class="plain text-xl" />
    <ui-icon [name]="name()" class="bound" />
    <ui-icon name="circle-alert" label="Error" class="labelled" />
  `,
})
class Host {
  name = signal<UiIconName>('ellipsis');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = (s: string) => root.querySelector(s) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('ui-icon', () => {
  it('draws the Lucide icon as an outline SVG with the brand stroke, keeping host classes', () => {
    const { q } = setup();
    const host = q('.plain');
    expect(host.classList).toContain('ui-icon');
    expect(host.classList).toContain('text-xl');
    const svg = host.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('2');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.children.length).toBe(UI_ICONS['trash-2'].length);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(UI_ICONS['trash-2'][0][1]['d']);
  });

  it('is decorative by default and announced as an image when labelled', () => {
    const { q } = setup();
    expect(q('.plain').getAttribute('aria-hidden')).toBe('true');
    expect(q('.plain').getAttribute('role')).toBeNull();
    const labelled = q('.labelled');
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-label')).toBe('Error');
    expect(labelled.getAttribute('aria-hidden')).toBeNull();
  });

  it('renders circles with their own fill and follows name changes', () => {
    const { fixture, host, q } = setup();
    const circles = q('.bound').querySelectorAll('circle');
    expect(circles.length).toBe(UI_ICONS['ellipsis'].filter(([tag]) => tag === 'circle').length);
    host.name.set('calendar');
    fixture.detectChanges();
    expect(q('.bound svg').children.length).toBe(UI_ICONS['calendar'].length);
    expect(q('.bound').querySelector('rect')).not.toBeNull();
  });
});
