import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, merge, Subject, switchMap, timer } from 'rxjs';

/** Unread notifications for the sidebar badge (ASM-001-S08): polled every minute, refreshed on demand. */
@Injectable({ providedIn: 'root' })
export class NotificationsBadge {
  #http = inject(HttpClient);
  #refresh = new Subject<void>();

  readonly unread = rxResource({
    stream: () =>
      merge(timer(0, 60_000), this.#refresh).pipe(
        switchMap(() => this.#http.get<{ unread: number }>('/api/v1/notifications', { params: { take: '1' } })),
        map((res) => res.unread),
      ),
  });

  refresh(): void {
    this.#refresh.next();
  }
}
