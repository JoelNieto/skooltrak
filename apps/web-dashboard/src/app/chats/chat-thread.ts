import { Loader, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import {
  ChatsChatDocument,
  ChatsChatMessagesDocument,
  ChatsChatQuery,
  ChatsMarkChatReadDocument,
  ChatsMessageReceivedDocument,
  ChatsMessageReceivedSubscription,
  ChatsSendMessageDocument,
  ChatsUnreadCountDocument,
} from '../graphql/generated/graphql';

@Component({
  selector: 'app-chat-thread',
  imports: [RouterLink, Loader, FormsModule, DatePipe],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/chats">Chats</a></li>
        <li>{{ chatDisplayName() }}</li>
      </ul>
    </div>

    @if (chatResource.isLoading()) {
      <lib-loader />
    } @else if (chatResource.hasValue() && chatResource.value()) {
      @let chat = chatResource.value()!;
      <div class="card bg-base-100 mt-4 flex flex-col max-h-[calc(100vh-6rem)]">
        <div class="card-body p-0 flex flex-col flex-1 min-h-0">
          <div class="shrink-0 p-4 border-b border-base-300 flex items-center gap-2">
            <div class="avatar avatar-placeholder">
              <div
                class="text-white rounded-full w-8"
                [style.background]="otherParticipant($any(chat))?.color || 'oklch(var(--p))'"
              >
                <span class="text-xs">{{ otherParticipant($any(chat))?.initials || '?' }}</span>
              </div>
            </div>
            <div>
              <h2 class="font-semibold">{{ chatDisplayName() }}</h2>
              <p class="text-sm text-base-content/60">{{ participantsCount($any(chat)) }} participantes</p>
            </div>
          </div>

          <div #messagesContainer class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            @if (messagesResource.isLoading()) {
              <lib-loader />
            } @else {
              @for (msg of messagesResource.value(); track msg.id) {
                <div class="flex  gap-2" [class.flex-row-reverse]="isOwnMessage(msg)">
                  @if (!isOwnMessage(msg)) {
                    <div>
                      <div class="avatar avatar-placeholder shrink-0">
                        <div
                          class="text-white rounded-full w-8"
                          [style.background]="msg.sender?.color || 'oklch(var(--p))'"
                        >
                          <span class="text-xs">{{ msg.sender?.initials }}</span>
                        </div>
                      </div>
                    </div>
                  }
                  <div
                    class="max-w-[80%] rounded-lg px-3 py-2"
                    [class.bg-primary]="isOwnMessage(msg)"
                    [class.text-primary-content]="isOwnMessage(msg)"
                    [class.bg-base-200]="!isOwnMessage(msg)"
                  >
                    @if (!isOwnMessage(msg)) {
                      <p class="text-xs font-medium mb-0.5">{{ msg.sender?.firstName }} {{ msg.sender?.lastName }}</p>
                    }
                    <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                    <p class="text-xs opacity-70 mt-1">{{ msg.createdAt | date: 'short' }}</p>
                  </div>
                </div>
              }
            }
          </div>

          <form (submit)="sendMessage($event)" class="shrink-0 p-4 border-t border-base-300 bg-base-100 rounded-b-lg">
            <div class="flex gap-2">
              <input
                type="text"
                class="input input-primary flex-1"
                placeholder="Escribe un mensaje..."
                [(ngModel)]="messageContent"
                name="content"
              />
              <button type="submit" class="btn btn-primary" [disabled]="!messageContent().trim() || sending()">
                @if (sending()) {
                  <span class="loading loading-spinner loading-sm"></span>
                } @else {
                  <span class="material-symbols-outlined">send</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    } @else {
      <p class="mt-4 text-base-content/60">Chat no encontrado</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatThread {
  id = input.required<string>();
  #apollo = inject(Apollo);
  #auth = inject(Auth);
  #toast = inject(Toast);

  messageContent = signal('');
  sending = signal(false);
  messagesContainer = viewChild<HTMLElement>('messagesContainer');

  chatResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) =>
      this.#apollo
        .watchQuery({
          query: ChatsChatDocument,
          variables: { id: params.id },
        })
        .valueChanges.pipe(map((r) => r.data?.chat ?? null)),
  });

  messagesResource = rxResource({
    params: () => ({ chatId: this.id() }),
    stream: ({ params }) =>
      this.#apollo
        .watchQuery({
          query: ChatsChatMessagesDocument,
          variables: { input: { chatId: params.chatId, limit: 50 } },
        })
        .valueChanges.pipe(map((r) => r.data?.chatMessages ?? [])),
  });

  constructor() {
    effect(() => {
      const chat = this.chatResource.value();
      if (chat?.id) {
        this.#apollo
          .mutate({
            mutation: ChatsMarkChatReadDocument,
            variables: { chatId: chat.id },
            refetchQueries: [{ query: ChatsUnreadCountDocument }],
          })
          .subscribe();
      }
    });

    // Subscribe to new messages for real-time updates
    effect((onCleanup) => {
      const chatId = this.id();
      if (!chatId) return;

      const sub = this.#apollo
        .subscribe<ChatsMessageReceivedSubscription>({
          query: ChatsMessageReceivedDocument,
          variables: { chatId },
        })
        .subscribe((result) => {
          const message = result.data?.messageReceived;
          if (!message || message.chatId !== chatId) return;

          const cached = this.#apollo.client.readQuery({
            query: ChatsChatMessagesDocument,
            variables: { input: { chatId, limit: 50 } },
          });
          const messages = cached?.chatMessages ?? [];
          if (messages.some((m) => m.id === message.id)) return;

          this.#apollo.client.writeQuery({
            query: ChatsChatMessagesDocument,
            variables: { input: { chatId, limit: 50 } },
            data: { chatMessages: [...messages, message] },
          });
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  chatDisplayName() {
    const chat = this.chatResource.value();
    if (!chat) return 'Chat';
    if (chat.name) return chat.name;
    const other = this.otherParticipant(chat as ChatsChatQuery['chat']);
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  }

  otherParticipant(chat: ChatsChatQuery['chat']) {
    if (!chat) return null;
    const me = this.#auth.user()?.id;
    return chat.participants?.find((p) => p.user?.id !== me)?.user ?? chat.participants?.[0]?.user;
  }

  participantsCount(chat: ChatsChatQuery['chat']) {
    return chat?.participants?.length ?? 0;
  }

  isOwnMessage(msg: { senderId?: string | null }) {
    return msg.senderId === this.#auth.user()?.id;
  }

  async sendMessage(e: Event) {
    e.preventDefault();
    const content = this.messageContent().trim();
    if (!content) return;

    this.sending.set(true);
    try {
      await this.#apollo
        .mutate({
          mutation: ChatsSendMessageDocument,
          variables: { input: { chatId: this.id(), content } },
          refetchQueries: [
            { query: ChatsChatMessagesDocument, variables: { input: { chatId: this.id(), limit: 50 } } },
          ],
        })
        .toPromise();
      this.messageContent.set('');
    } catch {
      this.#toast.showError('Error al enviar mensaje');
    } finally {
      this.sending.set(false);
    }
  }
}
