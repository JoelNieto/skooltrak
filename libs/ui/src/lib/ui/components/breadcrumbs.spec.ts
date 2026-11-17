import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Breadcrumbs } from './breadcrumbs';
import { PageHeader } from './page-header';

@Component({
  imports: [Breadcrumbs, PageHeader],
  template: `
    <ui-breadcrumbs
      class="trail"
      [items]="[{ label: 'Inicio', link: '/' }, { label: 'Administración' }, { label: 'Cursos', link: ['/courses'] }]"
    />
    <lib-page-header title="Cursos" [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos' }]" />
    <lib-page-header title="Sin ruta" class="no-trail" />
  `,
})
class Host {}

function setup() {
  TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ui-breadcrumbs', () => {
  it('renders links, plain sections and the current page', () => {
    const root = setup();
    const trail = root.querySelector('.trail') as HTMLElement;
    expect(trail.querySelector('nav')?.getAttribute('aria-label')).toBe('Ruta de navegación');
    const items = trail.querySelectorAll('li');
    expect(items.length).toBe(3);
    expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/');
    expect(items[1].querySelector('a')).toBeNull(); // no link → text
    // the last item is the current page even when it has a link
    expect(items[2].querySelector('a')).toBeNull();
    expect(items[2].querySelector('[aria-current="page"]')?.textContent).toContain('Cursos');
  });

  it('is rendered by the page header only when breadcrumbs are given', () => {
    const root = setup();
    const [withTrail, withoutTrail] = Array.from(root.querySelectorAll('lib-page-header'));
    expect(withTrail.querySelectorAll('ui-breadcrumbs li').length).toBe(2);
    expect(withTrail.querySelector('h1')?.textContent).toContain('Cursos');
    expect(withoutTrail.querySelector('ui-breadcrumbs')).toBeNull();
  });
});
