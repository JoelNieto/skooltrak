import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface ThreadListItem {
  id: string;
  title: string;
  preview?: string;
  audience?: string;
  unreadCount?: number;
  lastActivityAt?: string;
  type?: string;
  urgent?: boolean;
}

@Component({
  selector: 'lib-thread-list',
  imports: [NgClass],
  template: `
    <ul class="menu w-full gap-1">
      @for (thread of threads(); track thread.id) {
        <li class="w-full">
          <button
            class="flex flex-col items-start gap-0.5 rounded-lg border hover:bg-base-50 active:bg-base-100 focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-200 ease-in-out px-3 py-2 w-full"
            [ngClass]="{ 'border-primary/60': thread.id === selectedId() }"
            [class.border-transparent]="thread.id !== selectedId()"
            [class.bg-base-50]="thread.id === selectedId()"
            (click)="selected.emit(thread.id)"
          >
            <div class="flex w-full items-center gap-2">
              <span class="font-medium truncate">{{ thread.title }}</span>
              @if (thread.urgent) {
                <span class="badge badge-xs badge-soft badge-error">Importante</span>
              }
              @if (thread.unreadCount; as unread) {
                @if (unread > 0) {
                  <span class="badge badge-sm badge-primary ml-auto">{{ unread }}</span>
                }
              }
            </div>
            @if (thread.preview) {
              <span class="text-xs opacity-70 truncate w-full block">{{ thread.preview }}</span>
            }
            @if (thread.audience) {
              <span class="text-xs [thread.unreadCount > 0 ? opacity-80: opacity-60] truncate w-full block">
                {{ thread.audience }}
              </span>
            }
          </button>
        </li>
      } @empty {
        <li class="text-center text-sm opacity-60 py-6">No conversations yet.</li>
      }
    </ul>
  `,
})
export class ThreadList {
  threads = input<ThreadListItem[]>([]);
  selectedId = input<string | null | undefined>();
  selected = output<string>();
}
