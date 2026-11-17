import { Component, input, output } from '@angular/core';
import { Badge } from './badge';

export interface ThreadListItem {
  id: string;
  title: string;
  preview?: string;
  audience?: string;
  unreadCount?: number;
  lastActivityAt?: string;
  type?: string;
  urgent?: boolean;
  broadcast?: boolean;
}

@Component({
  selector: 'lib-thread-list',
  imports: [Badge],
  template: `
    <ul class="menu w-full gap-2">
      @for (thread of threads(); track thread.id) {
        <li class="w-full">
          <button
            class="flex justify-between items-center gap-0.5 rounded-xl border border-transparent hover:bg-primary/20 active:bg-base-100 transition-colors duration-200 ease-in-out px-3 py-2 w-full"
            [class.bg-primary/10]="thread.id === selectedId()"
            [class.border-primary/30]="thread.broadcast"
            [class.bg-primary/5]="thread.broadcast && thread.id !== selectedId()"
            (click)="selected.emit(thread.id)"
          >
            <div class="flex flex-col items-start min-w-0">
              <div class="flex w-full items-center gap-2">
                @if (thread.broadcast) {
                  <span class="material-symbols-outlined text-primary text-base shrink-0">campaign</span>
                }
                <span class="font-medium truncate">{{ thread.title }}</span>
                @if (thread.broadcast) {
                  <span uiBadge tone="action" size="sm" class="shrink-0">Comunicado</span>
                }
                @if (thread.unreadCount; as unread) {
                  @if (unread > 0) {
                    <span uiBadge tone="action" size="sm" class="ml-auto">{{ unread }}</span>
                  }
                }
              </div>
              @if (thread.preview) {
                <span class="text-xs opacity-70 truncate w-50 block">{{ thread.preview }}</span>
              }
              @if (thread.audience) {
                <span class="text-xs opacity-60 truncate w-full block">{{ thread.audience }}</span>
              }
            </div>
            @if (thread.urgent) {
              <span uiBadge tone="danger" size="sm">Importante</span>
            }
          </button>
        </li>
      } @empty {
        <li class="text-center text-sm opacity-60 py-6">Aún no hay conversaciones.</li>
      }
    </ul>
  `,
})
export class ThreadList {
  threads = input<ThreadListItem[]>([]);
  selectedId = input<string | null | undefined>();
  selected = output<string>();
}
