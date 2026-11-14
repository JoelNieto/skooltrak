import { Directive, input } from '@angular/core';

/**
 * Meaning of a badge. `action` follows the school's primary colour (links to a course or group,
 * the current item); status tones are for states (active, pending, overdue); `neutral` is for
 * plain labels and counts.
 */
export type BadgeTone = 'neutral' | 'action' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

/**
 * Small label for a status, category or count. One style (soft: tinted fill, coloured text); the
 * tone carries the meaning:
 *
 *   <span uiBadge tone="success">Activo</span>
 *   <span uiBadge size="sm" [tone]="statusTone(charge.status)">{{ charge.status }}</span>
 *   <a uiBadge tone="action" [routerLink]="['/courses', course.id]">{{ course.name }}</a>
 *
 * Map data to tones in TypeScript (`(status) => BadgeTone`) and bind `[tone]`, instead of building
 * DaisyUI class strings. DaisyUI's `.badge` stays underneath; this is the only place templates
 * should get it from.
 */
@Directive({
  selector: '[uiBadge]',
  host: {
    class: 'badge badge-soft ui-badge',
    '[class.badge-primary]': "tone() === 'action'",
    '[class.badge-info]': "tone() === 'info'",
    '[class.badge-success]': "tone() === 'success'",
    '[class.badge-warning]': "tone() === 'warning'",
    '[class.badge-error]': "tone() === 'danger'",
    '[class.badge-sm]': "size() === 'sm'",
  },
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly size = input<BadgeSize>('md');
}
