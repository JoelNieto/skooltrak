import { EmptyState, Loader } from '@/ui';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import { ChatsMyChatsDocument, ChatsMyChatsQuery, ChatType } from '../graphql/generated/graphql';

@Component({
  selector: 'app-chats',
  imports: [RouterLink, Loader, EmptyState],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Chats</li>
      </ul>
    </div>
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 class="text-2xl font-semibold">Chats</h1>
      <a routerLink="/chats/new" class="btn btn-primary">Nuevo chat</a>
    </div>

    @if (chatsResource.isLoading()) {
      <lib-loader />
    } @else {
      @let chats = chatsResource.value();
      @if (chats?.length) {
        <div class="mt-4 space-y-2">
          @for (chat of chats; track chat.id) {
            <a
              [routerLink]="['/chats', chat.id]"
              routerLinkActive="bg-primary/10"
              class="flex items-center gap-3 p-4 rounded-lg bg-base-200 hover:bg-base-100 transition-colors"
            >
              <div class="avatar avatar-placeholder">
                <div
                  class="text-white w-10 rounded-full"
                  [style.background]="otherParticipant(chat).color || 'oklch(var(--p))'"
                >
                  <span class="tex-lg">{{ otherParticipant(chat).initials || chat.name?.slice(0, 2) || '?' }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">
                  {{ chatDisplayName(chat) }}
                </p>
                <p class="text-sm text-base-content/60">{{ chatTypeLabel(chat.type) }}</p>
              </div>
              <span class="material-symbols-outlined text-base-content/50">chevron_right</span>
            </a>
          }
        </div>
      } @else {
        <lib-empty-state
          title="Sin chats"
          description="Inicia una conversación o crea un chat grupal"
          icon="chat"
          color="primary"
        />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Chats {
  #apollo = inject(Apollo);
  #auth = inject(Auth);

  chatsResource = rxResource({
    stream: () =>
      this.#apollo
        .watchQuery({ query: ChatsMyChatsDocument })
        .valueChanges.pipe(map((result) => (result.data?.myChats as ChatsMyChatsQuery['myChats']) ?? [])),
  });

  chatDisplayName(chat: ChatsMyChatsQuery['myChats'][0]) {
    if (chat.name) return chat.name;
    const other = this.otherParticipant(chat);
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  }

  otherParticipant(chat: ChatsMyChatsQuery['myChats'][0]) {
    const me = this.#auth.user()?.id;
    const other = chat.participants?.find((p) => p.user?.id !== me)?.user;
    return other ?? chat.participants?.[0]?.user;
  }

  chatTypeLabel(type: ChatType) {
    const labels: Record<ChatType, string> = {
      DIRECT: 'Chat directo',
      GROUP: 'Grupo',
      COURSE: 'Curso',
      ASSIGNMENT: 'Asignación',
      CLASS_GROUP: 'Grupo de clase',
    };
    return labels[type] ?? type;
  }
}
