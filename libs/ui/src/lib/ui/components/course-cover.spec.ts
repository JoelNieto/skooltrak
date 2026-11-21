import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { COURSE_COLOR_KEYS, SUBJECT_ICON_NAMES } from '@/shared';
import { UI_ICONS } from '../icons/icons';
import { CourseCover, courseColorVar } from './course-cover';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Component({
  imports: [CourseCover],
  template: `
    <ui-course-cover class="card" [color]="color()" [icon]="icon()"><span class="badge">1A</span></ui-course-cover>
    <ui-course-cover class="tile" variant="tile" color="TEAL" icon="flask-conical" />
  `,
})
class Host {
  color = signal<string | null>('INDIGO');
  icon = signal<string | null>('sigma');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, q: (s: string) => root.querySelector(s) as HTMLElement };
}

/** The `d` of the first path of the icon drawn inside `el`. */
const firstPath = (el: HTMLElement) => el.querySelector('.ui-course-cover__icon path')?.getAttribute('d');
const iconPath = (name: keyof typeof UI_ICONS) => (UI_ICONS[name].find(([tag]) => tag === 'path')?.[1] as { d: string }).d;

describe('ui-course-cover', () => {
  it('paints the color tag and the subject icon, with projected content on top', () => {
    const { fixture, q } = setup();
    const card = q('.card');

    expect(card.getAttribute('data-color')).toBe('INDIGO');
    // jsdom drops var() from inline styles, so read what the host binds.
    const cover = fixture.debugElement.query(By.css('.card')).componentInstance as unknown as Record<string, () => string>;
    expect(cover['background']()).toBe('var(--color-course-indigo)');
    expect(cover['foreground']()).toBe('var(--color-course-indigo-content)');
    expect(card.classList).toContain('h-32');
    expect(firstPath(card)).toBe(iconPath('sigma'));
    expect(card.querySelector('.ui-course-cover__watermark')).not.toBeNull();
    expect(q('.card .badge').textContent).toBe('1A');
  });

  it('renders the small tile without the watermark', () => {
    const { q } = setup();
    const tile = q('.tile');

    expect(tile.classList).toContain('size-18');
    expect(tile.getAttribute('data-color')).toBe('TEAL');
    expect(firstPath(tile)).toBe(iconPath('flask-conical'));
    expect(tile.querySelector('.ui-course-cover__watermark')).toBeNull();
  });

  it('falls back to slate and book-open for missing or unknown values', () => {
    const { fixture, q } = setup();
    fixture.componentInstance.color.set('PURPLE');
    fixture.componentInstance.icon.set('not-an-icon');
    fixture.detectChanges();

    expect(q('.card').getAttribute('data-color')).toBe('SLATE');
    expect(firstPath(q('.card'))).toBe(iconPath('book-open'));

    fixture.componentInstance.color.set(null);
    fixture.componentInstance.icon.set(null);
    fixture.detectChanges();
    expect(q('.card').getAttribute('data-color')).toBe('SLATE');
    expect(courseColorVar('ROSE')).toBe('var(--color-course-rose)');
    expect(courseColorVar(undefined)).toBe('var(--color-course-slate)');
  });

  it('has every subject icon in the registry', () => {
    expect(SUBJECT_ICON_NAMES.filter((name) => !(name in UI_ICONS))).toEqual([]);
  });
});

describe('course color tokens (ACA-001 BR .11)', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles/theme.css'), 'utf8');
  const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];

  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each(COURSE_COLOR_KEYS.map((k) => k.toLowerCase()))('%s: icon and text on the cover meet contrast', (key) => {
    const bg = token(`color-course-${key}`);
    const fg = token(`color-course-${key}-content`);
    expect(bg).toBeDefined();
    expect(fg).toBeDefined();
    // Defined once in :root, so the same pair applies in the light and dark themes.
    expect(contrast(bg ?? '', fg ?? '')).toBeGreaterThanOrEqual(4.5);
  });
});
