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
                @if (isContextualChat(chat.type)) {
                  <div class="flex items-center justify-center w-10 h-10 rounded-full text-white bg-primary">
                    <span class="material-symbols-outlined text-xl">{{ contextualChatIcon(chat.type) }}</span>
                  </div>
                } @else {
                  <div
                    class="text-white w-10 rounded-full"
                    [style.background]="otherParticipant(chat).color || 'oklch(var(--p))'"
                  >
                    <span class="tex-lg">{{ otherParticipant(chat).initials || chat.name?.slice(0, 2) || '?' }}</span>
                  </div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">
                  {{ chatDisplayName(chat) }}
                </p>
                <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span class="text-sm text-base-content/60">{{ chatTypeLabel(chat.type) }}</span>
                  @if (otherParticipant(chat); as user) {
                    @if (roleLabel(user?.role?.name); as label) {
                      <span class="badge badge-secondary badge-soft badge-sm">{{ label }}</span>
                    }
                    @if (user?.student?.classGroup?.name; as groupName) {
                      <span class="badge badge-outline badge-primary badge-sm">{{ groupName }}</span>
                    }
                  }
                </div>
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

  isContextualChat(type: ChatType) {
    return type === ChatType.Course || type === ChatType.Assignment || type === ChatType.ClassGroup;
  }

  contextualChatIcon(type: ChatType) {
    const icons: Record<string, string> = {
      [ChatType.Course]: 'school',
      [ChatType.Assignment]: 'assignment',
      [ChatType.ClassGroup]: 'groups',
    };
    return icons[type] ?? 'chat';
  }

  contextualChatColor(type: ChatType) {
    const colors: Record<string, string> = {
      [ChatType.Course]: 'oklch(var(--p))',
      [ChatType.Assignment]: 'oklch(var(--s))',
      [ChatType.ClassGroup]: 'oklch(var(--a))',
    };
    return colors[type] ?? 'oklch(var(--p))';
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
}
