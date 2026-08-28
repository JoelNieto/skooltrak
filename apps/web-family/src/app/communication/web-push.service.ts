import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

/**
 * Web-push (VAPID) subscription seam. Phase 0 registers the service worker and
 * subscribes to push, posting the subscription to the backend subscriber-sync
 * endpoint. Real VAPID key + Novu push wiring is added in Phase 3.
 */
@Injectable({ providedIn: 'root' })
export class WebPushService {
  readonly #http = inject(HttpClient);
  readonly #vapidPublicKey = '<<VAPID_PUBLIC_KEY>>';

  async isPushSupported(): Promise<boolean> {
    if (isDevMode()) return false;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      return !!reg.pushManager;
    } catch {
      return false;
    }
  }

  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!(await this.isPushSupported())) return null;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.#urlBase64ToUint8Array(this.#vapidPublicKey) as BufferSource,
      }));
    if (!sub) return null;

    await firstValueFrom(
      this.#http.post('/api/v1/communication/subscribers/sync', {
        userId,
        channelPrefs: { push: true },
      }),
    ).catch(() => undefined);

    return sub;
  }

  notifyPermissionState(): Observable<NotificationPermission> {
    return new Observable((subscriber) => {
      subscriber.next(
        (typeof Notification !== 'undefined' ? Notification.permission : 'denied') as NotificationPermission,
      );
      subscriber.complete();
    });
  }

  #urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
  }
}
