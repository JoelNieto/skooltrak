import { Component, computed, input } from '@angular/core';
import { UI_ICONS, UiIconName } from '../icons/icons';

/**
 * An outline icon from the brand's set (Lucide: 2px stroke, round caps and joins, 24px grid).
 *
 *   <ui-icon name="calendar" />                       decorative (hidden from screen readers)
 *   <ui-icon name="trash-2" class="text-xl text-error" />
 *   <ui-icon name="circle-alert" label="Error" />      meaningful on its own: announced as an image
 *
 * Size and colour come from the text around it: the icon is 1em square and drawn in currentColor,
 * so `text-xl` / `text-5xl` and `text-*` colour utilities work as they did with the icon font.
 * Default size is 1.5rem. `name` only accepts icons in the registry (libs/ui/.../icons/icons.ts),
 * so a typo or an unregistered icon fails the build instead of rendering nothing.
 */
@Component({
  selector: 'ui-icon',
  host: {
    class: 'ui-icon',
    '[attr.role]': "label() ? 'img' : null",
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      @for (el of node(); track $index) {
        @switch (el[0]) {
          @case ('path') {
            <path [attr.d]="el[1]['d']" />
          }
          @case ('circle') {
            <circle [attr.cx]="el[1]['cx']" [attr.cy]="el[1]['cy']" [attr.r]="el[1]['r']" [attr.fill]="el[1]['fill']" />
          }
          @case ('rect') {
            <rect
              [attr.x]="el[1]['x']"
              [attr.y]="el[1]['y']"
              [attr.width]="el[1]['width']"
              [attr.height]="el[1]['height']"
              [attr.rx]="el[1]['rx']"
              [attr.ry]="el[1]['ry']"
            />
          }
          @case ('line') {
            <line [attr.x1]="el[1]['x1']" [attr.y1]="el[1]['y1']" [attr.x2]="el[1]['x2']" [attr.y2]="el[1]['y2']" />
          }
          @case ('polyline') {
            <polyline [attr.points]="el[1]['points']" />
          }
          @case ('polygon') {
            <polygon [attr.points]="el[1]['points']" />
          }
          @case ('ellipse') {
            <ellipse [attr.cx]="el[1]['cx']" [attr.cy]="el[1]['cy']" [attr.rx]="el[1]['rx']" [attr.ry]="el[1]['ry']" />
          }
        }
      }
    </svg>
  `,
  styles: `
    /* In the components layer so text-* utilities on the host set the size. */
    @layer components {
      :host {
        display: inline-block;
        flex: none;
        width: 1em;
        height: 1em;
        font-size: 1.5rem;
        line-height: 1;
        vertical-align: -0.125em;
      }
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input.required<UiIconName>();
  /** Accessible name when the icon carries meaning on its own; leave empty when text sits beside it. */
  readonly label = input<string>();

  protected readonly node = computed(() => UI_ICONS[this.name()]);
}
