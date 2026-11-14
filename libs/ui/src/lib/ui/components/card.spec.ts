import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card, CardActions, CardBody, CardTitle } from './card';

@Component({
  imports: [Card, CardBody, CardTitle, CardActions],
  template: `
    <section uiCard class="mt-6 static-card">
      <div uiCardBody class="gap-y-4">
        <h2 uiCardTitle>Asistencia</h2>
        <div uiCardActions><button type="button">Ver</button></div>
      </div>
    </section>
    <a uiCard href="#" class="link-card">Curso</a>
    <div uiCard [interactive]="clickable()" class="toggle-card"></div>
  `,
})
class Host {
  clickable = signal(false);
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = (s: string) => root.querySelector(s) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('uiCard', () => {
  it('styles the host and its parts, keeping the host element and its classes', () => {
    const { q } = setup();
    const card = q('.static-card');
    expect(card.tagName).toBe('SECTION');
    expect(card.classList).toContain('card');
    expect(card.classList).toContain('ui-card');
    expect(card.classList).toContain('mt-6');
    expect(card.classList).not.toContain('ui-card-interactive');
    expect(q('[uiCardBody]').classList).toContain('card-body');
    expect(q('[uiCardBody]').classList).toContain('gap-y-4');
    expect(q('[uiCardTitle]').classList).toContain('card-title');
    expect(q('[uiCardActions]').classList).toContain('card-actions');
  });

  it('makes links interactive automatically and others on request', () => {
    const { fixture, host, q } = setup();
    expect(q('.link-card').classList).toContain('ui-card-interactive');
    expect(q('.toggle-card').classList).not.toContain('ui-card-interactive');
    host.clickable.set(true);
    fixture.detectChanges();
    expect(q('.toggle-card').classList).toContain('ui-card-interactive');
  });
});
