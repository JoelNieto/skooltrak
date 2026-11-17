import { Component, computed, input } from '@angular/core';

/**
 * Lockups of the Skooltrak logo (Pista), from the brand system:
 * https://claude.ai/artifact/RQXcMiWa88ZKmxoC8dSJaS
 *
 *   horizontal  primary: app bars, page headers, sign-in pages (min 96px wide)
 *   stacked     square or tall spaces: splash screens, empty states (min 64px wide)
 *   isotype     the mark alone, where the name is already on screen or space is under 96px (min 16px)
 *
 * Shows the `-color` file on light surfaces and `-on-dark` on dark ones, following ThemeService's
 * `data-theme` on <html> (the OS setting before it is set). Never re-colour or redraw the mark.
 * Size it from the host's height: `<ui-brand-logo class="h-8" />`.
 *
 * The files live in libs/ui/src/assets/brand; each app and Storybook serve them at /brand/.
 */
export type BrandLogoVariant = 'horizontal' | 'stacked' | 'isotype';

const FILES: Record<BrandLogoVariant, [light: string, dark: string]> = {
  horizontal: ['skooltrak-logo-horizontal-color.svg', 'skooltrak-logo-horizontal-on-dark.svg'],
  stacked: ['skooltrak-logo-stacked-color.svg', 'skooltrak-logo-stacked-on-dark.svg'],
  isotype: ['skooltrak-isotype-color.svg', 'skooltrak-isotype-on-dark.svg'],
};

@Component({
  selector: 'ui-brand-logo',
  host: { class: 'ui-brand-logo' },
  template: `
    <img class="logo logo-light" [src]="light()" [attr.alt]="alt()" />
    <img class="logo logo-dark" [src]="dark()" alt="" aria-hidden="true" />
  `,
  styles: `
    /* In the components layer so a host utility (class="h-10") overrides the default height:
     * unlayered component styles would beat Tailwind's layered utilities. */
    @layer components {
      :host {
        display: inline-flex;
        height: 2rem;
      }
    }
    .logo {
      height: 100%;
      width: auto;
    }
    .logo-dark {
      display: none;
    }
    :host-context([data-theme='dark']) .logo-light {
      display: none;
    }
    :host-context([data-theme='dark']) .logo-dark {
      display: block;
    }
    @media (prefers-color-scheme: dark) {
      :host-context(html:not([data-theme])) .logo-light {
        display: none;
      }
      :host-context(html:not([data-theme])) .logo-dark {
        display: block;
      }
    }
  `,
})
export class BrandLogo {
  readonly variant = input<BrandLogoVariant>('horizontal');
  /** Empty when the logo sits next to visible text that already names Skooltrak. */
  readonly alt = input('Skooltrak');

  protected readonly light = computed(() => `brand/${FILES[this.variant()][0]}`);
  protected readonly dark = computed(() => `brand/${FILES[this.variant()][1]}`);
}
