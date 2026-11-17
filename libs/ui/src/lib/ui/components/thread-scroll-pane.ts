import { afterRenderEffect, Component, computed, ElementRef, input, signal, untracked, viewChild } from '@angular/core';
import { Button } from './button';
import { Icon } from './icon';

const NEAR_BOTTOM_PX = 96;

@Component({
  selector: 'lib-thread-scroll-pane',
  imports: [Button, Icon],
  host: {
    class: 'relative flex flex-col flex-1 min-h-0',
  },
  template: `
    <div #scroller class="min-h-0 flex-1 overflow-y-auto p-3 space-y-2" (scroll)="onScroll($event)">
      <ng-content />
    </div>
    @if (showJump()) {
      <button
        uiButton
        variant="primary"
        size="sm"
        iconOnly
        type="button"
        class="absolute bottom-3 right-3 z-10 shadow-md"
        (click)="scrollToBottom()"
        aria-label="Ir al último mensaje"
        title="Ir al último mensaje"
      >
        <ui-icon name="arrow-down" class="text-base" />
      </button>
    }
  `,
})
export class ThreadScrollPane {
  /** Bumps when the transcript changes so we can follow new messages. */
  itemCount = input(0);
  /** True when the latest message is from the current user (always follow). */
  lastIsMine = input(false);
  /** Changes when switching threads — always pin to the latest message. */
  resetKey = input<string | null>(null);

  readonly nearBottom = signal(true);
  readonly showJump = computed(() => !this.nearBottom());

  readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  #prevCount = 0;
  #prevKey: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const count = this.itemCount();
      const key = this.resetKey();
      const lastIsMine = this.lastIsMine();

      const threadChanged = key !== this.#prevKey;
      const grew = count > this.#prevCount;
      this.#prevKey = key;
      this.#prevCount = count;

      const follow = untracked(() => this.nearBottom());
      if (threadChanged) {
        this.scrollToBottom('auto');
      } else if (grew && (lastIsMine || follow)) {
        this.scrollToBottom('smooth');
      }
    });
  }

  onScroll(event: Event) {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    this.nearBottom.set(this.#isNearBottom(el));
  }

  scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    this.nearBottom.set(true);
  }

  #isNearBottom(el: HTMLElement) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  }
}
