import { DeferredContentAware } from '@angular/aria/private';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { booleanAttribute, Directive, effect, inject, input } from '@angular/core';

/**
 * Tabs: switch between views of the same page (a course's grades / calendar / files).
 * Behaviour comes from `@angular/aria/tabs` (roles, arrow-key navigation, roving focus, lazy
 * panels); these directives add the design-system look and keep DaisyUI's classes inside libs/ui.
 *
 *   <div uiTabs>
 *     <div uiTabList [(selectedTab)]="tab" aria-label="Secciones del curso">
 *       <button uiTab value="grades">Calificaciones</button>
 *       <button uiTab value="files">Archivos <span uiBadge size="sm">3</span></button>
 *     </div>
 *     <div uiTabPanel value="grades">
 *       <ng-template uiTabContent>…</ng-template>
 *     </div>
 *     <div uiTabPanel value="files">
 *       <ng-template uiTabContent><app-course-files /></ng-template>
 *     </div>
 *   </div>
 *
 * Panel content always goes in `<ng-template uiTabContent>` (@angular/aria requires it). It renders
 * the first time its tab opens, so a panel's requests wait until someone looks at it, and then stays
 * rendered so form input and scroll survive tab switches (`[preserveContent]="false"` destroys it on
 * leave instead).
 *
 * `variant`: `box` (default) is a pill-shaped segmented control for a few sections; `line`
 * underlines the active tab, for longer rows or tabs inside a card. Arrow keys move between tabs
 * and select them (`selectionMode="explicit"` to select only on Enter/Space).
 */

/** Container that links a tab list to its panels: `<div uiTabs>`. */
@Directive({
  selector: '[uiTabs]',
  hostDirectives: [Tabs],
  host: { class: 'ui-tabs' },
})
export class UiTabs {}

export type UiTabListVariant = 'box' | 'line';

/** The row of tabs: `<div uiTabList [(selectedTab)]="tab" aria-label="…">`. */
@Directive({
  selector: '[uiTabList]',
  hostDirectives: [
    {
      directive: TabList,
      inputs: ['selectedTab', 'selectionMode', 'orientation', 'disabled', 'wrap'],
      outputs: ['selectedTabChange'],
    },
  ],
  host: {
    class: 'tabs ui-tab-list',
    '[class.tabs-box]': "variant() === 'box'",
    '[class.tabs-border]': "variant() === 'line'",
    '[class.ui-tab-list-line]': "variant() === 'line'",
  },
})
export class UiTabList {
  readonly variant = input<UiTabListVariant>('box');
}

/** One tab: `<button uiTab value="files">Archivos</button>`. `value` matches a uiTabPanel. */
@Directive({
  selector: '[uiTab]',
  hostDirectives: [{ directive: Tab, inputs: ['value', 'disabled', 'id'] }],
  host: {
    class: 'tab ui-tab',
    // A <button> host would submit an enclosing form without this.
    '[attr.type]': "isButton ? 'button' : null",
    '[class.tab-active]': 'tab.selected()',
    '[class.tab-disabled]': 'tab.disabled()',
  },
})
export class UiTab {
  protected readonly tab = inject(Tab);
  protected readonly isButton = this.tab.element.tagName === 'BUTTON';
}

/** The content for one tab: `<div uiTabPanel value="files">`. Hidden and inert while inactive. */
@Directive({
  selector: '[uiTabPanel]',
  hostDirectives: [{ directive: TabPanel, inputs: ['value', 'id'] }],
  host: { class: 'ui-tab-panel' },
})
export class UiTabPanel {
  /** Keep the content rendered after its first visit (default); `false` destroys it when the tab closes. */
  readonly preserveContent = input(true, { transform: booleanAttribute });

  constructor() {
    // TabPanel applies DeferredContentAware itself but doesn't expose its input to host directives,
    // so it's set here. @angular/aria/private: re-check on @angular/aria upgrades (tabs.spec covers it).
    const deferred = inject(DeferredContentAware);
    effect(() => deferred.preserveContent.set(this.preserveContent()));
  }
}

/** A panel's content: `<ng-template uiTabContent>` inside every uiTabPanel. Rendered on first open. */
@Directive({
  selector: 'ng-template[uiTabContent]',
  hostDirectives: [TabContent],
})
export class UiTabContent {}
