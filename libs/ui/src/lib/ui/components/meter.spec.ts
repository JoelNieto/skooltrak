import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meter } from './meter';

@Component({
  imports: [Meter],
  template: `
    <ui-meter class="default" [value]="value()" [max]="max()" label="18/27 entregaron" />
    <ui-meter class="danger" [value]="3" [max]="4" label="75 %" tone="danger" [showLabel]="false" />
  `,
})
class Host {
  value = signal(18);
  max = signal(27);
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, q: (s: string) => root.querySelector(s) as HTMLElement };
}

describe('ui-meter', () => {
  it('renders a labelled native progress with its caption', () => {
    const { q } = setup();
    const bar = q('.default progress') as HTMLProgressElement;

    expect(bar.value).toBe(18);
    expect(bar.max).toBe(27);
    expect(bar.getAttribute('aria-label')).toBe('18/27 entregaron');
    expect(bar.classList).toContain('progress-primary');
    expect(q('.default span').textContent?.trim()).toBe('18/27 entregaron');
  });

  it('uses the tone and can hide the caption', () => {
    const { q } = setup();

    expect(q('.danger progress').classList).toContain('progress-error');
    expect(q('.danger span')).toBeNull();
    expect(q('.danger progress').getAttribute('aria-label')).toBe('75 %');
  });

  it('clamps the value and treats a zero total as empty', () => {
    const { fixture, q } = setup();
    const host = fixture.componentInstance;

    host.value.set(40);
    fixture.detectChanges();
    expect((q('.default progress') as HTMLProgressElement).value).toBe(27);

    host.max.set(0);
    host.value.set(0);
    fixture.detectChanges();
    const empty = q('.default progress') as HTMLProgressElement;
    expect(empty.value).toBe(0);
    expect(empty.max).toBe(1);
  });
});
