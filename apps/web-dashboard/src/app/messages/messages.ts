import { Paginator, TimeAgoPipe } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorEyeDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, tap } from 'rxjs';
type User = Prisma.UserGetPayload<undefined> & {
  name: string;
  initials: string;
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
  imports: [RouterLink, TimeAgoPipe, Paginator, NgIcon, FormsModule],
  viewProviders: [
    provideIcons({
      phosphorTrashDuotone,
      phosphorEyeDuotone,
    }),
  ],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Mensajes</li>
      </ul>
    </div>
    <div class="flex flex:col md:flex-row md:justify-between md:items-center">
      <h1 class="text-2xl font-semibold">Mensajes</h1>
      <div class="flex gap-2">
        <a [routerLink]="['/messages/compose']" class="btn btn-primary"
          >Nuevo mensaje</a
        >
      </div>
    </div>
    <div class="tabs tabs-box mt-4">
      <input
        class="tab"
        type="radio"
        name="messages_tabs"
        aria-label="Inbox"
        checked="checked"
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
              @for(item of messagesResource.value(); track item.id) {
              <tr class="hover:bg-base-300">
                <td>
                  <input
                    type="checkbox"
                    class="checkbox"
                    [checked]="selectedStates()[item.id] || false"
                    (change)="onCheckboxChange(item.id, $event.target.checked)"
                  />
                </td>
                <td
                  class="text-neutral-900! font-semibold flex items-center gap-2"
                >
                  <div class="avatar avatar-placeholder">
                    <div
                      class="bg-neutral text-neutral-content w-7 rounded-full"
                    >
                      <span>{{ item.message.sender.initials }}</span>
                    </div>
                  </div>
                  {{ item.message.sender.name }}
                </td>
                <td class="text-neutral-500!">
                  <a [routerLink]="['/messages', item.message.id]">{{
                    item.message.subject
                  }}</a>
                </td>
                <td class="text-neutral-500!">
                  {{ item.message.createdAt | timeAgo }}
                </td>
                <td>
                  <button class="hover:text-error cursor-pointer">
                    <ng-icon name="phosphorTrashDuotone" class="text-lg" />
                  </button>
                </td>
              </tr>
              }
            </tbody>
            <tfoot></tfoot>
          </table>
          <div class="p-4 rounded-b-lg ">
            <lib-paginator
              [count]="pagination().count"
              [take]="pagination().take"
              [skip]="pagination().skip"
              (skipChange)="updateSkip($event)"
              (takeChange)="updateTake($event)"
            />
          </div>
        </div>
      </div>

      <input
        class="tab"
        type="radio"
        name="messages_tabs"
        aria-label="Outbox"
      />
    </div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Messages {
  #apollo = inject(Apollo);
  pagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });

  readonly selectedStates = signal<Record<string, boolean>>({});
  public selectedIds = computed(() => {
    const states = this.selectedStates();
    return this.messagesResource
      .value()
      ?.filter(({ id }) => states[id])
      .map(({ id }) => id);
  });

  readonly allSelected = computed(() => {
    const states = this.selectedStates();
    const messages = this.messagesResource.value();
    return (
      (messages?.length ?? 0) > 0 && messages?.every(({ id }) => states[id])
    );
  });

  public someSelected = computed(() => {
    const states = this.selectedStates();
    const messages = this.messagesResource.value();
    return messages?.some(({ id }) => states[id]) && !this.allSelected();
  });

  onCheckboxChange(itemId: string, isChecked: boolean): void {
    this.selectedStates.update((states) => ({
      ...states,
      [itemId]: isChecked,
    }));
  }

  onSelectAllChange(isChecked: boolean): void {
    this.selectedStates.update(() => {
      const newStates: Record<string, boolean> = {};
      this.messagesResource.value()?.forEach(({ id }) => {
        newStates[id] = isChecked;
      });
      return newStates;
    });
  }

  public take = computed(() => this.pagination().take);
  public skip = computed(() => this.pagination().skip);

  public updateSkip(skip: number) {
    this.pagination.update((prev) => ({ ...prev, skip }));
  }

  public updateTake(take: number) {
    this.pagination.update((prev) => ({ ...prev, take }));
  }

  public messagesResource = rxResource({
    params: () => ({
      take: this.take(),
      skip: this.skip(),
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{
          count: number;
          findManyMessages: MessageRecipientType[];
        }>({
          query: gql`
            query findManyMessages($take: Int!, $skip: Int!) {
              count: findManyMessagesCount
              findManyMessages(take: $take, skip: $skip) {
                id
                readAt
                createdAt
                message {
                  id
                  subject
                  createdAt
                  sender {
                    id
                    name
                    initials
                    email
                  }
                  recipients {
                    id
                    user {
                      id
                      initials
                      name
                      email
                    }
                  }
                }
              }
            }
          `,
          variables: {
            take: params.take,
            skip: params.skip,
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.pagination.update((prev) => ({
              ...prev,
              count: result.data.count,
            }));
          }),
          map((result) => result.data.findManyMessages)
        );
    },
  });
}
