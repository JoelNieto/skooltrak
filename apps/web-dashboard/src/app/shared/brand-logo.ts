import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skooltrak logo (mascot + wordmark) that stays legible in both themes.
 *
 * `skooltrak.png` has a navy wordmark, which disappears on dark surfaces; `skooltrak-dark.png` is
 * the same artwork with only the wordmark recoloured to the dark-theme ink. The theme is decided
 * by ThemeService's `data-theme` on <html>, falling back to the OS setting before it is set.
 *
 * Size it from the host, e.g. `<app-brand-logo class="h-8 md:h-10" />`.
 */
@Component({
  selector: 'app-brand-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img class="logo logo-light" src="skooltrak.png" [attr.alt]="alt()" />
    <img class="logo logo-dark" src="skooltrak-dark.png" alt="" aria-hidden="true" />
  `,
  styles: `
    :host {
      display: inline-flex;
      height: 2rem;
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
  /** Empty when the logo sits next to visible text that already names Skooltrak. */
  readonly alt = input('Skooltrak');
}
