import {
  Breadcrumbs,
  Button,
  Card,
  Confirmation,
  listState,
  Paginator,
  TimeAgoPipe,
  Toast,
  UiCheckbox,
  UiTab,
  UiTabContent,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../core/fetch-query-params';

type User = {
  id: string;
  name: string;
  initials: string;
  color?: string;
};
type RecipientType = {
  id: string;
  user: User;
};
type MessageType = {
  id: string;
  subject: string;
  createdAt: string;
  sender: User;
  recipients: RecipientType[];
};
type MessageRecipientType = {
  id: string;
  readAt?: string | null;
  message?: MessageType;
};

@Component({
  imports: [
    Breadcrumbs,
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiRowActions,
    UiCheckbox,
    Button,
    RouterLink,
    Paginator,
    FormsModule,
    UiTab,
    UiTabContent,
    UiTabList,
    UiTabPanel,
    UiTabs,
  ],
  providers: [TimeAgoPipe],
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Mensajes' }]" />
    <div class="flex flex:col md:flex-row md:justify-between md:items-center">
      <h1 class="text-2xl font-semibold">Mensajes</h1>
      <div class="flex gap-2">
        <a uiButton variant="primary" [routerLink]="['/messages/compose']">Nuevo mensaje</a>
      </div>
    </div>
    <div uiTabs class="mt-4 flex flex-col gap-4">
      <div uiTabList [(selectedTab)]="activeTab" aria-label="Bandejas de mensajes">
        <button uiTab value="inbox">Recibidos</button>
        <button uiTab value="outbox">Enviados</button>
      </div>
      <div uiTabPanel value="inbox">
        <ng-template uiTabContent>
          <div uiCard class="overflow-x-auto">
            <table uiTable [attr.aria-busy]="messagesResource.isLoading()">
              <thead>
                <tr>
                  <th class="w-12">
                    <input
                      uiCheckbox
                      tone="neutral"
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      [checked]="allSelected()"
                      [indeterminate]="someSelected()"
                      (change)="onSelectAllChange($event.target.checked)"
                    />
                  </th>
                  <th class="w-[15rem]">De</th>
                  <th>Asunto</th>
                  <th>Fecha</th>
                  <th class="w-12"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              @switch (inboxList.phase()) {
                @case ('skeleton') {
                  <tbody uiTableSkeleton [rows]="inboxTake()" [columns]="5"></tbody>
                }
                @case ('error') {
                  <tbody>
                    <tr uiTableError [columns]="5" (retry)="messagesResource.reload()"></tr>
                  </tbody>
                }
                @case ('ready') {
                  <tbody>
                    @for (item of inboxList.rows() ?? []; track item.id) {
                      <tr [class.bg-surface-0]="!item.readAt">
                        <td>
                          <input
                            uiCheckbox
                            tone="neutral"
                            type="checkbox"
                            [attr.aria-label]="'Seleccionar ' + (item.message?.subject ?? 'mensaje')"
                            [checked]="(item.id && selectedStates()[item.id]) || false"
                            (change)="item.id && onCheckboxChange(item.id, $any($event.target).checked)"
                          />
                        </td>
                        <td class="flex items-center gap-2" [class.font-bold]="!item.readAt">
                          @if (!item.readAt) {
                            <span class="w-2 h-2 bg-primary rounded-full"><span class="sr-only">No leído</span></span>
                          }
                          <div class="avatar avatar-placeholder">
                            <div
                              class="text-neutral-content w-7 rounded-full"
                              [style.background]="item.message?.sender?.color"
                            >
                              <span>{{ item.message?.sender?.initials }}</span>
                            </div>
                          </div>
                          {{ item.message?.sender?.name }}
                        </td>
                        <td [class.font-semibold]="!item.readAt" [class.text-ink-muted]="item.readAt">
                          <a [routerLink]="['/messages', item.message?.id ?? '']">{{ item.message?.subject }}</a>
                        </td>
                        <td class="text-ink-muted">
                          {{ formatTimeAgo(item.message?.createdAt) }}
                        </td>
                        <td>
                          <ui-row-actions
                            [actions]="deleteActions"
                            [label]="'Acciones para ' + (item.message?.subject ?? 'el mensaje')"
                            (action)="deleteMessage(item)"
                          />
                        </td>
                      </tr>
                    } @empty {
                      <tr uiTableEmpty [columns]="5" icon="inbox" title="Tu bandeja de entrada está vacía"></tr>
                    }
                  </tbody>
                }
              }
            </table>
            <div class="p-4 rounded-b-lg">
              <lib-paginator
                [count]="inboxPagination().count"
                [take]="inboxPagination().take"
                [skip]="inboxPagination().skip"
                (skipChange)="updateInboxSkip($event)"
                (takeChange)="updateInboxTake($event)"
              />
            </div>
          </div>
        </ng-template>
      </div>
      <div uiTabPanel value="outbox">
        <ng-template uiTabContent>
          <div uiCard class="overflow-x-auto">
            <table uiTable rowHover [attr.aria-busy]="sentMessagesResource.isLoading()">
              <thead>
                <tr>
                  <th class="w-12">
                    <input
                      uiCheckbox
                      tone="neutral"
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      [checked]="allSentSelected()"
                      [indeterminate]="someSentSelected()"
                      (change)="onSelectAllSentChange($event.target.checked)"
                    />
                  </th>
                  <th class="w-[15rem]">Para</th>
                  <th>Asunto</th>
                  <th>Fecha</th>
                  <th class="w-12"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              @switch (outboxList.phase()) {
                @case ('skeleton') {
                  <tbody uiTableSkeleton [rows]="outboxTake()" [columns]="5"></tbody>
                }
                @case ('error') {
                  <tbody>
                    <tr uiTableError [columns]="5" (retry)="sentMessagesResource.reload()"></tr>
                  </tbody>
                }
                @case ('ready') {
                  <tbody>
                    @for (item of outboxList.rows() ?? []; track item.id) {
                      <tr>
                        <td>
                          <input
                            uiCheckbox
                            tone="neutral"
                            type="checkbox"
                            [attr.aria-label]="'Seleccionar ' + item.subject"
                            [checked]="(item.id && sentSelectedStates()[item.id]) || false"
                            (change)="item.id && onSentCheckboxChange(item.id, $any($event.target).checked)"
                          />
                        </td>
                        <td class="text-ink-strong! font-semibold">
                          <div class="flex items-center gap-2">
                            @for (recipient of (item.recipients ?? []).slice(0, 2); track recipient.id ?? recipient) {
                              <div class="avatar avatar-placeholder">
                                <div
                                  class="text-neutral-content w-7 rounded-full text-xs"
                                  [style.background]="recipient.user?.color"
                                >
                                  <span>{{ recipient.user?.initials }}</span>
                                </div>
                              </div>
                            }
                            <span>{{ getRecipientsText(item) }}</span>
                          </div>
                        </td>
                        <td class="text-ink-muted!">
                          <a [routerLink]="['/messages', item.id]">{{ item.subject }}</a>
                        </td>
                        <td class="text-ink-muted!">
                          {{ formatTimeAgo(item.createdAt) }}
                        </td>
                        <td>
                          <ui-row-actions
                            [actions]="deleteActions"
                            [label]="'Acciones para ' + item.subject"
                            (action)="deleteSentMessage(item)"
                          />
                        </td>
                      </tr>
                    } @empty {
                      <tr uiTableEmpty [columns]="5" icon="send" title="Aún no has enviado mensajes">
                        <a uiButton size="sm" [routerLink]="['/messages/compose']">Nuevo mensaje</a>
                      </tr>
                    }
                  </tbody>
                }
              }
            </table>
            <div class="p-4 rounded-b-lg">
              <lib-paginator
                [count]="outboxPagination().count"
                [take]="outboxPagination().take"
                [skip]="outboxPagination().skip"
                (skipChange)="updateOutboxSkip($event)"
                (takeChange)="updateOutboxTake($event)"
              />
            </div>
          </div>
        </ng-template>
      </div>
    </div> `,
})
export default class Messages {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  #timeAgo = inject(TimeAgoPipe);

  activeTab = signal<'inbox' | 'outbox'>('inbox');

  inboxPagination = signal({ take: 10, skip: 0, count: 0 });
  outboxPagination = signal({ take: 10, skip: 0, count: 0 });
  pagination = this.inboxPagination;

  readonly selectedStates = signal<Record<string, boolean>>({});
  public selectedIds = computed(() => {
    const states = this.selectedStates();
    return this.messagesResource
      .value()
      ?.filter(({ id }) => id != null && states[id])
      .map(({ id }) => id)
      .filter((id): id is string => id != null);
  });

  readonly allSelected = computed(() => {
    const states = this.selectedStates();
    const messages = this.messagesResource.value();
    return (messages?.length ?? 0) > 0 && messages?.every(({ id }) => id != null && states[id]);
  });

  public someSelected = computed(() => {
    const states = this.selectedStates();
    const messages = this.messagesResource.value();
    return messages?.some(({ id }) => id != null && states[id]) && !this.allSelected();
  });

  onCheckboxChange(itemId: string, isChecked: boolean): void {
    this.selectedStates.update((states) => ({ ...states, [itemId]: isChecked }));
  }

  onSelectAllChange(isChecked: unknown): void {
    this.selectedStates.update(() => {
      const newStates: Record<string, boolean> = {};
      this.messagesResource.value()?.forEach(({ id }) => {
        if (id != null) newStates[id] = isChecked as boolean;
      });
      return newStates;
    });
  }

  readonly sentSelectedStates = signal<Record<string, boolean>>({});

  readonly allSentSelected = computed(() => {
    const states = this.sentSelectedStates();
    const messages = this.sentMessagesResource.value();
    return (messages?.length ?? 0) > 0 && messages?.every(({ id }) => id != null && states[id]);
  });

  public someSentSelected = computed(() => {
    const states = this.sentSelectedStates();
    const messages = this.sentMessagesResource.value();
    return messages?.some(({ id }) => id != null && states[id]) && !this.allSentSelected();
  });

  onSentCheckboxChange(itemId: string, isChecked: boolean): void {
    this.sentSelectedStates.update((states) => ({ ...states, [itemId]: isChecked }));
  }

  onSelectAllSentChange(isChecked: unknown): void {
    this.sentSelectedStates.update(() => {
      const newStates: Record<string, boolean> = {};
      this.sentMessagesResource.value()?.forEach(({ id }) => {
        if (id != null) newStates[id] = isChecked as boolean;
      });
      return newStates;
    });
  }

  public inboxTake = computed(() => this.inboxPagination().take);
  public inboxSkip = computed(() => this.inboxPagination().skip);

  public updateInboxSkip(skip: number) {
    this.inboxPagination.update((prev) => ({ ...prev, skip }));
  }

  public updateInboxTake(take: number) {
    this.inboxPagination.update((prev) => ({ ...prev, take }));
  }

  public take = this.inboxTake;
  public skip = this.inboxSkip;
  public updateSkip = this.updateInboxSkip.bind(this);
  public updateTake = this.updateInboxTake.bind(this);

  public outboxTake = computed(() => this.outboxPagination().take);
  public outboxSkip = computed(() => this.outboxPagination().skip);

  public updateOutboxSkip(skip: number) {
    this.outboxPagination.update((prev) => ({ ...prev, skip }));
  }

  public updateOutboxTake(take: number) {
    this.outboxPagination.update((prev) => ({ ...prev, take }));
  }

  public messagesResource = httpResource<MessageRecipientType[]>(
    () => ({
      url: '/api/v1/messages',
      params: toFetchQueryRecord({
        page: Math.floor(this.inboxSkip() / this.inboxTake()) + 1,
        pageSize: this.inboxTake(),
      }),
    }),
    { defaultValue: [] },
  );

  #inboxCount = httpResource<number>(() => ({
    url: '/api/v1/messages/count',
  }));

  public sentMessagesResource = httpResource<MessageType[]>(
    () => ({
      url: '/api/v1/messages/mine',
      params: toFetchQueryRecord({
        page: Math.floor(this.outboxSkip() / this.outboxTake()) + 1,
        pageSize: this.outboxTake(),
      }),
    }),
    { defaultValue: [] },
  );

  #sentCount = httpResource<number>(() => ({
    url: '/api/v1/messages/sent-count',
  }));

  /** Both boxes with smooth loading: rows stay while the next page loads. */
  protected readonly inboxList = listState(this.messagesResource);
  protected readonly outboxList = listState(this.sentMessagesResource);

  /** The one action in each row's menu (ui-row-actions). */
  protected readonly deleteActions: UiRowAction[] = [
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  constructor() {
    effect(() => {
      const count = this.#inboxCount.value();
      if (count != null) {
        this.inboxPagination.update((prev) => ({ ...prev, count }));
      }
    });
    effect(() => {
      const count = this.#sentCount.value();
      if (count != null) {
        this.outboxPagination.update((prev) => ({ ...prev, count }));
      }
    });
  }

  formatTimeAgo(date: Date | string | null | undefined): string {
    return date ? this.#timeAgo.transform(date) : '-';
  }

  getRecipientsText(message: { recipients?: Array<{ user?: { name?: string | null } }> }): string {
    const recipients = message.recipients ?? [];
    const names = recipients.map((r) => r.user?.name ?? '').filter(Boolean);
    if (names.length <= 2) {
      return names.join(', ');
    }
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  }

  public deleteMessage(message: { id?: string }) {
    if (!message?.id) return;
    this.#confirmation
      .confirm({
        title: 'Eliminar mensaje',
        message: '¿Estás seguro de eliminar este mensaje?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() => this.#http.delete(`/api/v1/messages/recipients/${message.id!}`)),
      )
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Mensaje eliminado correctamente');
          this.messagesResource.reload();
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar el mensaje');
        },
      });
  }

  public deleteSentMessage(message: { id?: string }) {
    if (!message?.id) return;
    this.#confirmation
      .confirm({
        title: 'Eliminar mensaje enviado',
        message: '¿Estás seguro de eliminar este mensaje enviado?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() => this.#http.delete(`/api/v1/messages/${message.id!}`)),
      )
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Mensaje eliminado correctamente');
          this.sentMessagesResource.reload();
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar el mensaje');
        },
      });
  }
}
