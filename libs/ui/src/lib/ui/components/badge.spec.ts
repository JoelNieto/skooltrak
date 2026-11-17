import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge, BadgeTone } from './badge';

@Component({
  imports: [Badge],
  template: `
    <span uiBadge class="plain">Etiqueta</span>
    <span uiBadge size="sm" [tone]="tone()" class="status">Estado</span>
    <a uiBadge tone="action" href="#" class="link">Curso</a>
  `,
})
class Host {
  tone = signal<BadgeTone>('success');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = (s: string) => root.querySelector(s) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('uiBadge', () => {
  it('is a soft neutral badge by default', () => {
    const { q } = setup();
    const plain = q('.plain');
    expect([...plain.classList]).toEqual(expect.arrayContaining(['badge', 'badge-soft', 'ui-badge']));
    expect([...plain.classList].filter((c) => /^badge-(primary|info|success|warning|error|sm)$/.test(c))).toEqual([]);
  });

  it('maps tone and size to DaisyUI classes and follows tone changes', () => {
    const { fixture, host, q } = setup();
    const status = q('.status');
    expect(status.classList).toContain('badge-success');
    expect(status.classList).toContain('badge-sm');

    host.tone.set('danger');
    fixture.detectChanges();
    expect(status.classList).toContain('badge-error');
    expect(status.classList).not.toContain('badge-success');

    host.tone.set('neutral');
    fixture.detectChanges();
    expect(status.classList).not.toContain('badge-error');
  });

  it('marks the new tone with its own class and no DaisyUI tone class', () => {
    const { fixture, host, q } = setup();
    host.tone.set('new');
    fixture.detectChanges();
    const status = q('.status');
    expect(status.classList).toContain('ui-badge-new');
    expect([...status.classList].filter((c) => /^badge-(primary|info|success|warning|error)$/.test(c))).toEqual([]);
  });

  it('works on links with the action tone', () => {
    const { q } = setup();
    expect(q('.link').tagName).toBe('A');
    expect(q('.link').classList).toContain('badge-primary');
  });
});
