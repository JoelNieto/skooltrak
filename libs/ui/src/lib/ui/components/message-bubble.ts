import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

type Urgency = 'ROUTINE' | 'IMPORTANT' | 'EMERGENCY';

const URGENCY_BADGE: Record<Urgency, string> = {
  ROUTINE: '',
  IMPORTANT: 'badge-warning',
  EMERGENCY: 'badge-error',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  ROUTINE: '',
  IMPORTANT: 'Important',
  EMERGENCY: 'Emergency',
};

@Component({
  selector: 'lib-message-bubble',
  template: `
    <div class="flex" [class.justify-end]="mine()">
      <div
        class="max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm"
        [class]="mine() ? 'bg-primary text-primary-content rounded-br-sm' : 'bg-base-200 text-base-content rounded-bl-sm'"
      >
        @if (!mine() && senderName()) {
          <p class="font-semibold text-xs opacity-80 mb-0.5">{{ senderName() }}</p>
        }
        <p class="whitespace-pre-wrap break-words">{{ body() }}</p>
        <div class="flex items-center gap-2 mt-1">
          @if (urgency() !== 'ROUTINE') {
            <span class="badge badge-xs" [class]="badgeClass()">{{ urgencyLabel() }}</span>
          }
          @if (sentAt()) {
            <span class="text-[10px] opacity-70 ml-auto">{{ sentAt() }}</span>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubble {
  body = input.required<string>();
  senderName = input<string>();
  sentAt = input<string>();
  urgency = input<Urgency>('ROUTINE');
  mine = input<boolean>(false);

  badgeClass = () => URGENCY_BADGE[this.urgency()];
  urgencyLabel = () => URGENCY_LABEL[this.urgency()];
}
