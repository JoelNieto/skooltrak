import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ThreadListItem {
  id: string;
  title: string;
  preview?: string;
  unreadCount?: number;
  lastActivityAt?: string;
  type?: string;
  urgent?: boolean;
}

@Component({
  selector: 'lib-thread-list',
  template: `
    <ul class="menu w-full gap-1">
      @for (thread of threads(); track thread.id) {
        <li>
          <button
            class="flex flex-col items-start gap-0.5 rounded-lg"
            [class.menu-active]="thread.id === selectedId()"
            (click)="selected.emit(thread.id)"
          >
            <div class="flex w-full items-center gap-2">
              @if (thread.urgent) {
                <span class="badge badge-xs badge-error"></span>
              }
              <span class="font-medium truncate">{{ thread.title }}</span>
              @if (thread.unreadCount; as unread) {
                @if (unread > 0) {
                  <span class="badge badge-sm badge-primary ml-auto">{{ unread }}</span>
                }
              }
            </div>
            @if (thread.preview) {
              <span class="text-xs opacity-70 truncate w-full">{{ thread.preview }}</span>
            }
          </button>
        </li>
      } @empty {
        <li class="text-center text-sm opacity-60 py-6">No conversations yet.</li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadList {
  threads = input<ThreadListItem[]>([]);
  selectedId = input<string | null | undefined>();
  selected = output<string>();
}
