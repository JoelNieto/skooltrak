import { Directive, input } from '@angular/core';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

/**
 * Inline message inside a page or form: a load error, a warning before an action, a confirmation.
 *
 *   <div uiAlert tone="danger">
 *     <ui-icon name="circle-alert" />
 *     <span>No se pudo cargar el boletín.</span>
 *     <button uiButton variant="ghost" size="sm" (click)="reload()">Reintentar</button>
 *   </div>
 *
 * One soft style (tinted fill, hairline border, tone-coloured text kept readable on both themes).
 * `danger` is announced immediately (`role="alert"`); other tones are polite (`role="status"`).
 * For transient feedback after an action, use the Toast service instead.
 * DaisyUI's `.alert` stays underneath; this is the only place templates should get it from.
 */
@Directive({
  selector: '[uiAlert]',
  host: {
    class: 'alert alert-soft ui-alert',
    '[class.alert-info]': "tone() === 'info'",
    '[class.alert-success]': "tone() === 'success'",
    '[class.alert-warning]': "tone() === 'warning'",
    '[class.alert-error]': "tone() === 'danger'",
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
  },
})
export class Alert {
  readonly tone = input<AlertTone>('info');
}
