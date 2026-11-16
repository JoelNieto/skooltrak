import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, computed, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconName } from '../icons/icons';
import { Button } from './button';
import { Icon } from './icon';

/**
 * One entry in a row's actions menu. `danger` for destructive actions (shown last, in red);
 * `link` makes it navigate (a real link, so it opens in a new tab too) instead of emitting;
 * `hidden` leaves it out (permissions, row state).
 */
export interface UiRowAction {
  id: string;
  label: string;
  icon?: UiIconName;
  tone?: 'danger';
  disabled?: boolean;
  hidden?: boolean;
  link?: string | readonly unknown[];
}

/**
 * The actions for one table row, behind an ellipsis button:
 *
 *   <td class="text-right">
 *     <ui-row-actions [actions]="actions" [label]="'Acciones para ' + subject.name"
 *                     (action)="onAction($event, subject)" />
 *   </td>
 *
 * Keyboard and screen readers come from @angular/aria (menu button pattern: Enter / Space / arrows
 * open it, arrows move, Escape closes). Each row gets its own menu. `label` names the button, so
 * say which row it acts on. Emits the chosen action's id.
 */
@Component({
  selector: 'ui-row-actions',
  imports: [Button, Icon, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule, RouterLink],
  host: { class: 'ui-row-actions' },
  template: `
    <button
      uiButton
      variant="ghost"
      size="sm"
      iconOnly
      type="button"
      ngMenuTrigger
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      #trigger="ngMenuTrigger"
      [menu]="menu()"
      [attr.aria-label]="label()"
    >
      <ui-icon name="ellipsis" class="text-xl" />
    </button>
    <ng-template
      [cdkConnectedOverlayOpen]="trigger.expanded()"
      [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
      [cdkConnectedOverlayPositions]="positions"
      cdkAttachPopoverAsChild
    >
      <div ngMenu class="ui-menu" #menuRef="ngMenu" (itemSelected)="onSelected($event)">
        <ng-template ngMenuContent>
          @for (a of ordered(); track a.id) {
            @if (a.link) {
              <a
                ngMenuItem
                class="ui-menu-item"
                [class.ui-menu-item-danger]="a.tone === 'danger'"
                [value]="a.id"
                [disabled]="!!a.disabled"
                [routerLink]="a.link"
              >
                @if (a.icon) {
                  <ui-icon [name]="a.icon" class="text-base" />
                }
                <span>{{ a.label }}</span>
              </a>
            } @else {
              <button
                ngMenuItem
                type="button"
                class="ui-menu-item"
                [class.ui-menu-item-danger]="a.tone === 'danger'"
                [value]="a.id"
                [disabled]="!!a.disabled"
              >
                @if (a.icon) {
                  <ui-icon [name]="a.icon" class="text-base" />
                }
                <span>{{ a.label }}</span>
              </button>
            }
          }
        </ng-template>
      </div>
    </ng-template>
  `,
})
export class UiRowActions {
  readonly actions = input.required<readonly UiRowAction[]>();
  /** Accessible name of the button: say which row it acts on ("Acciones para Matemáticas"). */
  readonly label = input('Acciones');
  readonly action = output<string>();

  /** Visible actions, destructive ones last. */
  protected readonly ordered = computed(() => {
    const shown = this.actions().filter((a) => !a.hidden);
    return [...shown.filter((a) => a.tone !== 'danger'), ...shown.filter((a) => a.tone === 'danger')];
  });
  protected readonly menu = viewChild<Menu<string>>('menuRef');
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];

  /** Links navigate on their own; the rest are emitted for the page to handle. */
  protected onSelected(id: string | undefined): void {
    const chosen = this.actions().find((a) => a.id === id);
    if (chosen && !chosen.link) this.action.emit(chosen.id);
  }
}
