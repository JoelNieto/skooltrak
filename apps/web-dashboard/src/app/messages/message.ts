import { EditorViewer, Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
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

@Component({
  selector: 'app-message',
  imports: [Loader, RouterLink, DatePipe, EditorViewer],

  template: `@defer{ @if(messageResource.hasValue()){ @let message =
    messageResource.value();
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/messages">Mensajes</a></li>
        <li>{{ message.sender.name }}: {{ message.subject }}</li>
      </ul>
    </div>
    <div class="card card-border bg-base-100 border-base-300 mt-4">
      <div class="card-body">
        <div class="border-b border-base-300">
          <h1 class="text-2xl font-bold mb-4">{{ message.subject }}</h1>
        </div>
        <div
          class="flex items-center justify-between border-b border-base-300 w-full py-4"
        >
          <div class="flex items-center gap-2">
            <div class="avatar avatar-placeholder">
              <div class="bg-neutral text-neutral-content w-10 rounded-full">
                <span>{{ message.sender.initials }}</span>
              </div>
            </div>
            <div class="flex flex-col text-sm">
              <div class="font-sembibold">{{ message.sender.name }}</div>
              <div class="text-base-content/60">Para: {{ receivers() }}</div>
            </div>
          </div>
          <span class="text-sm text-base-content/60">{{
            message.createdAt | date : 'short'
          }}</span>
        </div>
        <div class="py-3">
          <lib-editor-viewer [innerHTML]="message.content" />
        </div>
      </div>
    </div>

    } } @placeholder(minimum 1s){
    <lib-loader />
    }`,
})
export default class Message {
  public id = input.required<string>();
  #apollo = inject(Apollo);

  messageResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      return this.#apollo
        .watchQuery<{ findMessageById: MessageType }>({
          query: gql`
            query findMessageById($id: String!) {
              findMessageById(id: $id) {
                id
                subject
                content
                createdAt
                sender {
                  id
                  initials
                  name
                  email
                  role {
                    id
                    name
                  }
                  student {
                    id
                  }
                  teacher {
                    id
                  }
                }
                recipients {
                  id
                  user {
                    id
                    initials
                    name
                    email
                    role {
                      id
                      name
                    }
                    student {
                      id
                    }
                    teacher {
                      id
                    }
                  }
                }
              }
            }
          `,
          variables: {
            id: params.id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.findMessageById));
    },
  });

  public receivers = computed(() =>
    this.messageResource
      .value()
      ?.recipients.map((recipient) => recipient.user.name)
      .join(', ')
  );
}
