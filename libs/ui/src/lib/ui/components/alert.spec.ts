import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert, AlertTone } from './alert';

@Component({
  imports: [Alert],
  template: `
    <div uiAlert class="plain mt-4">Información</div>
    <div uiAlert [tone]="tone()" class="dynamic"><span>Mensaje</span></div>
  `,
})
class Host {
  tone = signal<AlertTone>('warning');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, q: (s: string) => root.querySelector(s) as HTMLElement };
}

describe('uiAlert', () => {
  it('is a polite info alert by default, keeping host classes', () => {
    const { q } = setup();
    const a = q('.plain');
    expect([...a.classList]).toEqual(expect.arrayContaining(['alert', 'alert-soft', 'ui-alert', 'alert-info', 'mt-4']));
    expect(a.getAttribute('role')).toBe('status');
  });

  it('maps tones and announces danger immediately', () => {
    const { fixture, host, q } = setup();
    const a = q('.dynamic');
    expect(a.classList).toContain('alert-warning');
    expect(a.getAttribute('role')).toBe('status');
    host.tone.set('danger');
    fixture.detectChanges();
    expect(a.classList).toContain('alert-error');
    expect(a.classList).not.toContain('alert-warning');
    expect(a.getAttribute('role')).toBe('alert');
  });
});
