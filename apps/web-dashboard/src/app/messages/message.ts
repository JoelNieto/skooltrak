import { EditorViewer, Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
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
type ThreadMessage = {
  id: string;
  replyToId?: string;
  quotedText?: string;
  quotedAuthor?: string;
  content: string;
  createdAt: Date;
  sender: User;
};
type ThreadDisplayMessage = ThreadMessage & {
  depth: number;
  isRoot: boolean;
};

@Component({
  selector: 'app-message',
  imports: [Loader, RouterLink, DatePipe, EditorViewer, FormsModule],

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
        <div class="flex justify-end gap-2 border-t border-base-300 pt-3">
          <button class="btn btn-ghost btn-sm" (click)="prepareReply(message)">
            Responder
          </button>
          <button
            class="btn btn-ghost btn-sm"
            (click)="prepareReply(message, true)"
          >
            Responder con cita
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h2 class="text-xl font-semibold">Conversacion</h2>
      <div class="mt-4 space-y-3">
        @for(item of threadMessages(); track item.id) {
        <div
          class="card card-bordered bg-base-100"
          [style.marginLeft.px]="item.depth * 24"
        >
          <div class="card-body p-4">
            <div class="flex items-center justify-between text-sm">
              <div class="font-semibold">{{ item.sender.name }}</div>
              <span class="text-base-content/60">{{
                item.createdAt | date : 'short'
              }}</span>
            </div>
            @if(item.quotedText){
            <div class="message-quote">
              <div class="text-xs text-base-content/60">
                Cita de {{ item.quotedAuthor }}
              </div>
              <div class="text-sm">{{ item.quotedText }}</div>
            </div>
            }
            <div class="mt-2 whitespace-pre-wrap text-sm">
              {{ item.content }}
            </div>
            <div class="mt-3 flex gap-2">
              <button class="btn btn-ghost btn-xs" (click)="prepareReply(item)">
                Responder
              </button>
              <button
                class="btn btn-ghost btn-xs"
                (click)="prepareReply(item, true)"
              >
                Responder con cita
              </button>
            </div>
          </div>
        </div>
        }
      </div>
    </div>

    <div class="card card-bordered bg-base-100 mt-6">
      <div class="card-body">
        <h3 class="text-lg font-semibold">Responder</h3>
        @if(replyDraft().quotedText){
        <div class="message-quote">
          <div class="text-xs text-base-content/60">
            Cita de {{ replyDraft().quotedAuthor }}
          </div>
          <div class="text-sm">{{ replyDraft().quotedText }}</div>
          <div class="mt-2">
            <button class="btn btn-ghost btn-xs" (click)="clearQuote()">
              Quitar cita
            </button>
          </div>
        </div>
        }
        <textarea
          class="textarea textarea-bordered w-full mt-3"
          rows="4"
          placeholder="Escribe tu respuesta"
          [ngModel]="replyDraft().content"
          (ngModelChange)="updateReplyContent($event)"
        ></textarea>
        <div class="flex justify-end gap-2 mt-3">
          <button class="btn btn-primary btn-sm" (click)="sendReply()">
            Enviar respuesta
          </button>
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

  private readonly currentUser = {
    id: 'me',
    name: 'Tu',
    initials: 'TU',
  } as User;
  private readonly threadReplies = signal<ThreadMessage[]>([]);
  public readonly replyDraft = signal<{
    content: string;
    replyToId?: string;
    quotedText?: string;
    quotedAuthor?: string;
  }>({
    content: '',
  });

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

  public readonly threadMessages = computed<ThreadDisplayMessage[]>(() => {
    const message = this.messageResource.value();
    if (!message) {
      return [];
    }
    const rootMessage: ThreadMessage = {
      id: message.id,
      content: this.toPlainText(message.content),
      createdAt: new Date(message.createdAt),
      sender: message.sender,
    };
    const items = [rootMessage, ...this.threadReplies()];
    const byId = new Map(items.map((item) => [item.id, item]));
    return items.map((item) => ({
      ...item,
      depth: this.getDepth(item, byId),
      isRoot: item.id === rootMessage.id,
    }));
  });

  prepareReply(
    target: MessageType | ThreadMessage,
    includeQuote = false
  ): void {
    const threadTarget = this.toThreadMessage(target);
    const quotedText = includeQuote
      ? this.toPlainText(threadTarget.content).slice(0, 200)
      : undefined;
    this.replyDraft.set({
      content: '',
      replyToId: threadTarget.id,
      quotedText,
      quotedAuthor: includeQuote ? threadTarget.sender.name : undefined,
    });
  }

  updateReplyContent(content: string): void {
    this.replyDraft.update((prev) => ({
      ...prev,
      content,
    }));
  }

  clearQuote(): void {
    this.replyDraft.update((prev) => ({
      ...prev,
      replyToId: prev.replyToId,
      quotedText: undefined,
      quotedAuthor: undefined,
    }));
  }

  sendReply(): void {
    const draft = this.replyDraft();
    const message = this.messageResource.value();
    if (!message || !draft.content.trim()) {
      return;
    }
    const reply: ThreadMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      replyToId: draft.replyToId ?? message.id,
      quotedText: draft.quotedText,
      quotedAuthor: draft.quotedAuthor,
      content: draft.content.trim(),
      createdAt: new Date(),
      sender: this.currentUser,
    };
    this.threadReplies.update((prev) => [...prev, reply]);
    this.replyDraft.set({
      content: '',
    });
  }

  private getDepth(
    message: ThreadMessage,
    byId: Map<string, ThreadMessage>
  ): number {
    let depth = 0;
    let current = message;
    while (current.replyToId) {
      const parent = byId.get(current.replyToId);
      if (!parent) {
        break;
      }
      depth += 1;
      current = parent;
      if (depth > 6) {
        break;
      }
    }
    return depth;
  }

  private toPlainText(content: string): string {
    return content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toThreadMessage(target: MessageType | ThreadMessage): ThreadMessage {
    if ('recipients' in target) {
      return {
        id: target.id,
        content: this.toPlainText(target.content),
        createdAt: new Date(target.createdAt),
        sender: target.sender,
      };
    }
    return target;
  }
}
