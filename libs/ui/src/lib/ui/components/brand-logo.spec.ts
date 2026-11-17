import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrandLogo, BrandLogoVariant } from './brand-logo';

@Component({
  imports: [BrandLogo],
  template: `
    <ui-brand-logo class="plain h-8" />
    <ui-brand-logo class="variant" [variant]="variant()" alt="" />
  `,
})
class Host {
  variant = signal<BrandLogoVariant>('stacked');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const imgs = (s: string) => [...root.querySelectorAll(`${s} img`)] as HTMLImageElement[];
  return { fixture, host: fixture.componentInstance, root, imgs };
}

describe('ui-brand-logo', () => {
  it('shows the horizontal lockup by default, light and dark files, one alt text', () => {
    const { root, imgs } = setup();
    const [light, dark] = imgs('.plain');
    expect(light.getAttribute('src')).toBe('brand/skooltrak-logo-horizontal-color.svg');
    expect(dark.getAttribute('src')).toBe('brand/skooltrak-logo-horizontal-on-dark.svg');
    expect(light.getAttribute('alt')).toBe('Skooltrak');
    expect(dark.getAttribute('alt')).toBe('');
    expect(dark.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.plain')?.classList).toContain('h-8');
  });

  it('switches lockup with the variant input and allows an empty alt', () => {
    const { fixture, host, imgs } = setup();
    expect(imgs('.variant')[0].getAttribute('src')).toBe('brand/skooltrak-logo-stacked-color.svg');
    expect(imgs('.variant')[0].getAttribute('alt')).toBe('');
    host.variant.set('isotype');
    fixture.detectChanges();
    expect(imgs('.variant').map((i) => i.getAttribute('src'))).toEqual([
      'brand/skooltrak-isotype-color.svg',
      'brand/skooltrak-isotype-on-dark.svg',
    ]);
  });
});
