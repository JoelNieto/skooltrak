import { Component, input } from '@angular/core';
import { Badge, BadgeTone } from './badge';

type Urgency = 'ROUTINE' | 'IMPORTANT' | 'EMERGENCY';

const URGENCY_TONE: Record<Urgency, BadgeTone> = {
  ROUTINE: 'neutral',
  IMPORTANT: 'warning',
  EMERGENCY: 'danger',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  ROUTINE: '',
  IMPORTANT: 'Importante',
  EMERGENCY: 'Emergencia',
};

@Component({
  selector: 'lib-message-bubble',
  imports: [Badge],
  template: `
    <div class="flex" [class.justify-end]="mine()">
      <div
        class="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
        [class]="mine() ? 'bg-primary/20 text-ink-strong' : 'bg-surface-0 text-ink-strong'"
      >
        @if (!mine() && senderName()) {
          <p class="font-semibold text-xs opacity-80 mb-0.5">{{ senderName() }}</p>
        }
        <p class="whitespace-pre-wrap break-words">{{ body() }}</p>
        <div class="flex items-center gap-2 mt-1">
          @if (urgency() !== 'ROUTINE') {
            <span uiBadge size="sm" [tone]="urgencyTone()">{{ urgencyLabel() }}</span>
          }
          @if (sentAt()) {
            <span class="text-[10px] opacity-70 ml-auto">{{ sentAt() }}</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class MessageBubble {
  body = input.required<string>();
  senderName = input<string>();
  sentAt = input<string>();
  urgency = input<Urgency>('ROUTINE');
  mine = input<boolean>(false);

  urgencyTone = () => URGENCY_TONE[this.urgency()];
  urgencyLabel = () => URGENCY_LABEL[this.urgency()];
}
