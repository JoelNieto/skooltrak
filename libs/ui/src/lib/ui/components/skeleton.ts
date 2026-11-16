import { Directive } from '@angular/core';

/**
 * Placeholder shape for content that is loading: `<span uiSkeleton class="block h-4 w-32"></span>`.
 * Size and shape come from utilities on the host. A flat pulse on the sunken surface: DaisyUI's
 * skeleton animates a gradient shimmer, which the brand rules out. Hidden from screen readers;
 * announce loading once for the region instead (aria-busy, or a status message).
 */
@Directive({
  selector: '[uiSkeleton]',
  host: { class: 'skeleton ui-skeleton', 'aria-hidden': 'true' },
})
export class Skeleton {}
