import { Loader, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import ChatSocketService, { ChatMessageReceivedPayload } from './chat-socket.service';

/** Aligns with dashboard REST + Socket.IO chat API. */
type ChatParticipantUser = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  initials?: string | null;
  color?: string | null;
  role?: { name?: string | null } | null;
  student?: { classGroup?: { name?: string | null } | null } | null;
};

type ChatDto = {
  id: string;
  name?: string | null;
  type: string;
  participants?: { user?: ChatParticipantUser | null }[];
};

type ChatMessageDto = {
  id: string;
  chatId: string;
  senderId?: string | null;
  content: string;
  createdAt: string;
  sender?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    initials?: string | null;
    color?: string | null;
    role?: { name?: string | null };
    student?: { classGroup?: { name?: string | null } };
  } | null;
};

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
              @if (isContextualChat($any(chat).type)) {
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-full text-white"
                  [style.background]="contextualChatColor($any(chat).type)"
                >
                  <span class="material-symbols-outlined text-base">{{ contextualChatIcon($any(chat).type) }}</span>
                </div>
              } @else {
                <div
                  class="text-white rounded-full w-8"
                  [style.background]="otherParticipant($any(chat))?.color || 'oklch(var(--p))'"
                >
                  <span class="text-xs">{{ otherParticipant($any(chat))?.initials || '?' }}</span>
                </div>
              }
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold">{{ chatDisplayName() }}</h2>
              <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span class="text-sm text-base-content/60">{{ participantsCount($any(chat)) }} participantes</span>
                @if (otherParticipant($any(chat)); as user) {
                  @if (roleLabel(user?.role?.name); as label) {
                    <span class="badge badge-secondary badge-soft badge-sm">{{ label }}</span>
                  }
                  @if (user?.student?.classGroup?.name; as groupName) {
                    <span class="badge badge-outline badge-primary badge-sm">{{ groupName }}</span>
                  }
                }
              </div>
            </div>
          </div>

          <div #messagesContainer class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            @if (messagesResource.isLoading()) {
              <lib-loader />
            } @else {
              <div class="w-full space-y-3">
                @for (msg of messages(); track msg.id) {
                  <div
                    class="chat space-y-2"
                    [class]="{ 'chat-start': !isOwnMessage(msg), 'chat-end': isOwnMessage(msg) }"
                  >
                    <div class="chat-image avatar">
                      <div class="avatar avatar-placeholder">
                        <div
                          class="text-white rounded-full w-8"
                          [style.background]="msg.sender?.color || 'oklch(var(--p))'"
                        >
                          <span class="text-xs">{{ msg.sender?.initials }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="chat-header">
                      <p class="text-xs font-medium">{{ msg.sender?.firstName }} {{ msg.sender?.lastName }}</p>
                    </div>
                    <div
                      class="chat-bubble"
                      [class.bg-primary]="!isOwnMessage(msg)"
                      [class.text-primary-content]="!isOwnMessage(msg)"
                      [class.bg-base-200]="isOwnMessage(msg)"
                    >
                      <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                    </div>
                    <div class="chat-footer">
                      <p class="text-xs opacity-70">{{ msg.createdAt | date: 'short' }}</p>
                    </div>
                  </div>
                }
              </div>
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
  private http = inject(HttpClient);
  #auth = inject(Auth);
  #toast = inject(Toast);
  #chatSocket = inject(ChatSocketService);

  messageContent = signal('');
  sending = signal(false);
  /** Live message list (REST load + socket appends). */
  messages = signal<ChatMessageDto[]>([]);
  messagesContainer = viewChild<HTMLElement>('messagesContainer');

  chatResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) =>
      this.http.get<ChatDto | null>(`/api/v1/chats/${params.id}`).pipe(map((c) => c ?? null)),
  });

  messagesResource = rxResource({
    params: () => ({ chatId: this.id() }),
    stream: ({ params }) =>
      this.http
        .get<ChatMessageDto[]>(`/api/v1/chats/messages`, {
          params: { chatId: params.chatId, limit: '50' },
        })
        .pipe(
          map((list) => {
            this.messages.set(list ?? []);
            return list ?? [];
          }),
        ),
  });

  constructor() {
    effect(() => {
      const chat = this.chatResource.value();
      if (chat?.id) {
        this.http.patch(`/api/v1/chats/${chat.id}/read`, {}).subscribe({
          next: () => this.http.get<number>('/api/v1/chats/unread-count').subscribe(),
          error: () => {},
        });
      }
    });

    effect((onCleanup) => {
      const chatId = this.id();
      if (!chatId) return;

      this.#chatSocket.joinChat(chatId);

      const handler = (payload: ChatMessageReceivedPayload) => {
        if (payload.chatId !== chatId || !payload.message) return;
        this.messages.update((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message as ChatMessageDto];
        });
      };

      const unsubscribe = this.#chatSocket.onMessageReceived(handler);

      onCleanup(() => {
        unsubscribe();
        this.#chatSocket.leaveChat(chatId);
      });
    });
  }

  chatDisplayName() {
    const chat = this.chatResource.value();
    if (!chat) return 'Chat';
    if (chat.name) return chat.name;
    const other = this.otherParticipant(chat);
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  }

  otherParticipant(chat: ChatDto | null) {
    if (!chat) return null;
    const me = this.#auth.user()?.id;
    return chat.participants?.find((p) => p.user?.id !== me)?.user ?? chat.participants?.[0]?.user;
  }

  participantsCount(chat: ChatDto | null) {
    return chat?.participants?.length ?? 0;
  }

  isOwnMessage(msg: { senderId?: string | null }) {
    return msg.senderId === this.#auth.user()?.id;
  }

  roleLabel(roleName?: string | null): string | null {
    if (!roleName) return null;
    const labels: Record<string, string> = {
      STUDENT: 'Estudiante',
      TEACHER: 'Docente',
      ORG_ADMIN: 'Administrador',
      SYSADMIN: 'Administrador',
      ADMIN: 'Administrador',
      PARENT: 'Padre/Representante',
    };
    return labels[roleName] ?? roleName;
  }

  isContextualChat(type: string) {
    return type === 'COURSE' || type === 'ASSIGNMENT' || type === 'CLASS_GROUP';
  }

  contextualChatIcon(type: string) {
    const icons: Record<string, string> = {
      COURSE: 'school',
      ASSIGNMENT: 'assignment',
      CLASS_GROUP: 'groups',
    };
    return icons[type] ?? 'chat';
  }

  contextualChatColor(type: string) {
    const colors: Record<string, string> = {
      COURSE: 'oklch(var(--p))',
      ASSIGNMENT: 'oklch(var(--s))',
      CLASS_GROUP: 'oklch(var(--a))',
    };
    return colors[type] ?? 'oklch(var(--p))';
  }

  async sendMessage(e: Event) {
    e.preventDefault();
    const content = this.messageContent().trim();
    if (!content) return;

    this.sending.set(true);
    try {
      await this.http
        .post<ChatMessageDto>('/api/v1/chats/messages', {
          chatId: this.id(),
          content,
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
