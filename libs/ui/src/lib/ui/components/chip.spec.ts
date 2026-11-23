import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chip, ChipCount } from './chip';

@Component({
  imports: [Chip, ChipCount],
  template: `
    <div role="group" aria-label="Filtrar">
      @for (option of options; track option) {
        <button uiChip [pressed]="chosen() === option" (click)="chosen.set(option)">
          {{ option }} <span uiChipCount>2</span>
        </button>
      }
    </div>
  `,
})
class Host {
  options = ['Todas', 'Ciencias'];
  chosen = signal('Todas');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  return { fixture, buttons };
}

describe('uiChip', () => {
  it('is a plain button, not a submit button', () => {
    const { buttons } = setup();
    expect(buttons[0].getAttribute('type')).toBe('button');
    expect(buttons[0].classList).toContain('ui-chip');
  });

  it('announces and shows which chip is pressed, and follows changes', () => {
    const { fixture, buttons } = setup();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    expect(buttons[0].classList).toContain('ui-chip--pressed');
    expect(buttons[1].classList).not.toContain('ui-chip--pressed');

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(buttons[1].classList).toContain('ui-chip--pressed');
  });

  it('styles the count', () => {
    const { buttons } = setup();
    expect(buttons[0].querySelector('.ui-chip__count')?.textContent).toBe('2');
  });
});
