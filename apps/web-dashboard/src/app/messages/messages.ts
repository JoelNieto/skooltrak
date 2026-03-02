import { Confirmation, EmptyState, Paginator, TimeAgoPipe, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';

import { Apollo } from 'apollo-angular';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import {
  MessagesFindManyMessagesDocument,
  MessagesFindMyMessagesDocument,
  MessagesRemoveMessageDocument,
  MessagesRemoveMessageRecipientDocument,
} from '../graphql/generated/graphql';
type User = Prisma.UserGetPayload<undefined> & {
  name: string;
  initials: string;
  color?: string;
};
type RecipientType = Prisma.MessageRecipientGetPayload<undefined> & {
  user: User;
};
type MessageType = Prisma.MessageGetPayload<undefined> & {
  sender: User;
  recipients: RecipientType[];
};
type MessageRecipientType = Prisma.MessageRecipientGetPayload<undefined> & {
  message: MessageType;
};

@Component({
  imports: [RouterLink, Paginator, FormsModule, EmptyState],
  providers: [TimeAgoPipe],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Mensajes</li>
      </ul>
    </div>
    <div class="flex flex:col md:flex-row md:justify-between md:items-center">
      <h1 class="text-2xl font-semibold">Mensajes</h1>
      <div class="flex gap-2">
        <a [routerLink]="['/messages/compose']" class="btn btn-primary">Nuevo mensaje</a>
      </div>
    </div>
    <div class="tabs tabs-box mt-4">
      <input
        class="tab"
        type="radio"
        name="messages_tabs"
        aria-label="Inbox"
        [checked]="activeTab() === 'inbox'"
        (change)="setActiveTab('inbox')"
      />
      <div class="tab-content bg-base-100 border-base-300 p-4">
        <div class="overflow-x-auto bg-base-100 rounded-lg">
          <table class="table">
            <thead>
              <tr>
                <th class="w-12">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="onSelectAllChange($event.target.checked)"
                    class="checkbox"
                  />
                </th>
                <th class="w-[15rem]"></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of messagesResource.value(); track item.id) {
                <tr class="hover:bg-base-300" [class.bg-base-200]="!item.readAt">
                  <td>
                    <input
                      type="checkbox"
                      class="checkbox"
                      [checked]="(item.id && selectedStates()[item.id]) || false"
                      (change)="item.id && onCheckboxChange(item.id, $any($event.target).checked)"
                    />
                  </td>
                  <td class="flex items-center gap-2" [class.font-bold]="!item.readAt">
                    @if (!item.readAt) {
                      <span class="w-2 h-2 bg-primary rounded-full"></span>
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
                  <td [class.font-semibold]="!item.readAt" [class.text-neutral-500]="item.readAt">
                    <a [routerLink]="['/messages', item.message?.id ?? '']">{{ item.message?.subject }}</a>
                  </td>
                  <td class="text-neutral-500">
                    {{ formatTimeAgo(item.message?.createdAt) }}
                  </td>
                  <td>
                    <button class="hover:text-error cursor-pointer" (click)="deleteMessage(item)">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center">
                    <lib-empty-state
                      title="Sin mensajes"
                      description="No hay mensajes en tu bandeja de entrada"
                      icon="mail"
                      color="primary"
                    />
                  </td>
                </tr>
              }
            </tbody>
            <tfoot></tfoot>
          </table>
          <div class="p-4 rounded-b-lg ">
            <lib-paginator
              [count]="inboxPagination().count"
              [take]="inboxPagination().take"
              [skip]="inboxPagination().skip"
              (skipChange)="updateInboxSkip($event)"
              (takeChange)="updateInboxTake($event)"
            />
          </div>
        </div>
      </div>

      <input
        class="tab"
        type="radio"
        name="messages_tabs"
        aria-label="Enviados"
        [checked]="activeTab() === 'outbox'"
        (change)="setActiveTab('outbox')"
      />
      <div class="tab-content bg-base-100 border-base-300 p-4">
        <div class="overflow-x-auto bg-base-100 rounded-lg">
          <table class="table">
            <thead>
              <tr>
                <th class="w-12">
                  <input
                    type="checkbox"
                    [checked]="allSentSelected()"
                    [indeterminate]="someSentSelected()"
                    (change)="onSelectAllSentChange($event.target.checked)"
                    class="checkbox"
                  />
                </th>
                <th class="w-[15rem]">Para</th>
                <th>Asunto</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of sentMessagesResource.value(); track item.id) {
                <tr [routerLink]="['/messages', item.id]" class="hover:bg-base-300">
                  <td>
                    <input
                      type="checkbox"
                      class="checkbox"
                      [checked]="(item.id && sentSelectedStates()[item.id]) || false"
                      (change)="item.id && onSentCheckboxChange(item.id, $any($event.target).checked)"
                    />
                  </td>
                  <td class="text-neutral-900! font-semibold">
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
                  <td class="text-neutral-500!">
                    <a>{{ item.subject }}</a>
                  </td>
                  <td class="text-neutral-500!">
                    {{ formatTimeAgo(item.createdAt) }}
                  </td>
                  <td>
                    <button class="hover:text-error cursor-pointer" (click)="deleteSentMessage(item)">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center">
                    <lib-empty-state
                      title="Sin mensajes enviados"
                      description="No has enviado ningún mensaje"
                      icon="send"
                      color="primary"
                    />
                  </td>
                </tr>
              }
            </tbody>
            <tfoot></tfoot>
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
      </div>
    </div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Messages {
  #apollo = inject(Apollo);
  #confirmation = inject(Confirmation);
  #toast = inject(Toast);
  #timeAgo = inject(TimeAgoPipe);

  // Tab state
  activeTab = signal<'inbox' | 'outbox'>('inbox');

  setActiveTab(tab: 'inbox' | 'outbox') {
    this.activeTab.set(tab);
  }

  // Inbox pagination
  inboxPagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });

  // Outbox pagination
  outboxPagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });

  // For backward compatibility
  pagination = this.inboxPagination;

  // Inbox selection state
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
    this.selectedStates.update((states) => ({
      ...states,
      [itemId]: isChecked,
    }));
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

  // Outbox selection state
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
    this.sentSelectedStates.update((states) => ({
      ...states,
      [itemId]: isChecked,
    }));
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

  // Inbox pagination methods
  public inboxTake = computed(() => this.inboxPagination().take);
  public inboxSkip = computed(() => this.inboxPagination().skip);

  public updateInboxSkip(skip: number) {
    this.inboxPagination.update((prev) => ({ ...prev, skip }));
  }

  public updateInboxTake(take: number) {
    this.inboxPagination.update((prev) => ({ ...prev, take }));
  }

  // For backward compatibility
  public take = this.inboxTake;
  public skip = this.inboxSkip;
  public updateSkip = this.updateInboxSkip.bind(this);
  public updateTake = this.updateInboxTake.bind(this);

  // Outbox pagination methods
  public outboxTake = computed(() => this.outboxPagination().take);
  public outboxSkip = computed(() => this.outboxPagination().skip);

  public updateOutboxSkip(skip: number) {
    this.outboxPagination.update((prev) => ({ ...prev, skip }));
  }

  public updateOutboxTake(take: number) {
    this.outboxPagination.update((prev) => ({ ...prev, take }));
  }

  // Inbox resource
  public messagesResource = rxResource({
    params: () => ({
      take: this.inboxTake(),
      skip: this.inboxSkip(),
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{
          count: number;
          findManyMessages: MessageRecipientType[];
        }>({
          query: MessagesFindManyMessagesDocument,
          fetchPolicy: 'network-only',
          variables: {
            take: params.take,
            skip: params.skip,
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.inboxPagination.update((prev) => ({
              ...prev,
              count: result.data?.count ?? 0,
            }));
          }),
          map((result) => result.data?.findManyMessages ?? []),
          catchError((err) => {
            console.error('Error fetching inbox messages:', err);
            return of([]);
          }),
        );
    },
  });

  // Outbox resource
  public sentMessagesResource = rxResource({
    params: () => ({
      take: this.outboxTake(),
      skip: this.outboxSkip(),
      tab: this.activeTab(), // Trigger refetch when tab changes
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{
          count: number;
          findMyMessages: MessageType[];
        }>({
          query: MessagesFindMyMessagesDocument,
          fetchPolicy: 'network-only',
          variables: {
            take: params.take,
            skip: params.skip,
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.outboxPagination.update((prev) => ({
              ...prev,
              count: result.data?.count ?? 0,
            }));
          }),
          map((result) => result.data?.findMyMessages ?? []),
          catchError((err) => {
            console.error('Error fetching sent messages:', err);
            return of([]);
          }),
        );
    },
  });

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
        switchMap(() =>
          this.#apollo.mutate({
            mutation: MessagesRemoveMessageRecipientDocument,
            variables: {
              id: message.id!,
            },
          }),
        ),
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
        switchMap(() =>
          this.#apollo.mutate({
            mutation: MessagesRemoveMessageDocument,
            variables: {
              id: message.id!,
            },
          }),
        ),
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
