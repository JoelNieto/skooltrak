import { EditorViewer, Loader, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, tap } from 'rxjs';
import Auth from '../auth/auth';

type User = Prisma.UserGetPayload<undefined> & {
  name: string;
  initials: string;
};
type RecipientType = Prisma.MessageRecipientGetPayload<undefined> & {
  user: User;
};
type ReplyType = Prisma.MessageGetPayload<undefined> & {
  sender: User;
  parentMessageId: string | null;
};
type MessageType = Prisma.MessageGetPayload<undefined> & {
  sender: User;
  recipients: RecipientType[];
  replies: ReplyType[];
};

@Component({
  selector: 'app-message',
  imports: [Loader, RouterLink, DatePipe, EditorViewer, FormsModule],
  styles: `
    :host ::ng-deep blockquote {
      border-left: 3px solid oklch(var(--bc) / 0.3);
      padding-left: 1rem;
      margin: 0.5rem 0;
      color: oklch(var(--bc) / 0.7);
      font-style: italic;
    }
  `,
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
              <div class="font-semibold">{{ message.sender.name }}</div>
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

    @if(hasReplies()) {
    <div class="mt-6">
      <h2 class="text-xl font-semibold">Conversacion</h2>
      <div class="mt-4 space-y-3">
        @for(item of repliesOnly(); track item.id) {
        <div class="card card-bordered bg-base-100">
          <div class="card-body p-4">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <div class="avatar avatar-placeholder">
                  <div
                    class="bg-neutral text-neutral-content w-8 rounded-full text-xs"
                  >
                    <span>{{ item.sender.initials }}</span>
                  </div>
                </div>
                <div class="font-semibold">{{ item.sender.name }}</div>
              </div>
              <span class="text-base-content/60">{{
                item.createdAt | date : 'short'
              }}</span>
            </div>
            <div class="mt-2 text-sm">
              <lib-editor-viewer [innerHTML]="item.content" />
            </div>
            <div class="mt-3 flex gap-2">
              <button
                class="btn btn-ghost btn-xs"
                (click)="prepareReplyFromReply(item)"
              >
                Responder
              </button>
              <button
                class="btn btn-ghost btn-xs"
                (click)="prepareReplyFromReply(item, true)"
              >
                Responder con cita
              </button>
            </div>
          </div>
        </div>
        }
      </div>
    </div>
    }

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
          [disabled]="isSending()"
        ></textarea>
        <div class="flex justify-end gap-2 mt-3">
          <button
            class="btn btn-primary btn-sm"
            (click)="sendReply()"
            [disabled]="isSending() || !replyDraft().content.trim()"
          >
            @if(isSending()) {
            <span class="loading loading-spinner loading-sm"></span>
            } Enviar respuesta
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
  #auth = inject(Auth);
  #toast = inject(Toast);

  public readonly isSending = signal(false);
  public readonly replyDraft = signal<{
    content: string;
    replyToId?: string;
    quotedText?: string;
    quotedAuthor?: string;
  }>({
    content: '',
  });

  private readonly currentUser = computed(() => {
    const user = this.#auth.user();
    if (!user) {
      return {
        id: '',
        name: 'Tu',
        initials: 'TU',
      } as User;
    }
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase(),
    } as User;
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
                replies {
                  id
                  content
                  createdAt
                  parentMessageId
                  sender {
                    id
                    initials
                    name
                    email
                  }
                }
              }
            }
          `,
          variables: {
            id: params.id,
          },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((result) => result.data.findMessageById),
          tap((message) => {
            if (message) {
              this.markAsRead(message.id);
            }
          }),
        );
    },
  });

  private markAsRead(messageId: string): void {
    this.#apollo
      .mutate({
        mutation: gql`
          mutation markMessageAsRead($messageId: String!) {
            markMessageAsRead(messageId: $messageId) {
              id
              readAt
            }
          }
        `,
        variables: { messageId },
      })
      .subscribe({
        error: (err) => console.error('Error marking message as read:', err),
      });
  }

  public receivers = computed(() =>
    this.messageResource
      .value()
      ?.recipients.map((recipient) => recipient.user.name)
      .join(', ')
  );

  public hasReplies = computed(() => {
    const message = this.messageResource.value();
    return message?.replies && message.replies.length > 0;
  });

  public repliesOnly = computed(() => {
    const message = this.messageResource.value();
    if (!message?.replies) {
      return [];
    }
    return message.replies;
  });

  prepareReply(message: MessageType, includeQuote = false): void {
    const quotedText = includeQuote
      ? this.toPlainText(message.content).slice(0, 200)
      : undefined;
    this.replyDraft.set({
      content: '',
      replyToId: message.id,
      quotedText,
      quotedAuthor: includeQuote ? message.sender.name : undefined,
    });
  }

  prepareReplyFromReply(reply: ReplyType, includeQuote = false): void {
    const quotedText = includeQuote
      ? this.toPlainText(reply.content).slice(0, 200)
      : undefined;
    this.replyDraft.set({
      content: '',
      replyToId: reply.id,
      quotedText,
      quotedAuthor: includeQuote ? reply.sender.name : undefined,
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

    this.isSending.set(true);

    // Build the reply content - include quote if present
    let replyContent = draft.content.trim();
    if (draft.quotedText) {
      replyContent = `<blockquote><strong>${draft.quotedAuthor}:</strong> ${draft.quotedText}</blockquote>\n\n${replyContent}`;
    }

    // Reply goes back to the original sender
    const recipientIds = [message.sender.id];

    this.#apollo
      .mutate({
        mutation: gql`
          mutation createMessage($createMessageInput: CreateMessageInput!) {
            createMessage(createMessageInput: $createMessageInput) {
              id
            }
          }
        `,
        variables: {
          createMessageInput: {
            subject: `Re: ${message.subject}`,
            content: replyContent,
            recipientIds,
            parentMessageId: message.id,
          },
        },
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Respuesta enviada exitosamente');
          this.replyDraft.set({ content: '' });
          this.isSending.set(false);
          // Refetch the message to update the thread
          this.messageResource.reload();
        },
        error: (err) => {
          console.error('Error sending reply:', err);
          this.#toast.showError('Error al enviar la respuesta');
          this.isSending.set(false);
        },
      });
  }

  toPlainText(content: string): string {
    return content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
