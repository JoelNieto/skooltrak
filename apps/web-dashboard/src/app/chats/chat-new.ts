import { Loader, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import {
  ChatsCreateDirectChatDocument,
  ChatsMyChatsDocument,
  ContactsFindContactsDocument,
} from '../graphql/generated/graphql';

@Component({
  selector: 'app-chat-new',
  imports: [RouterLink, Loader, FormsModule],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/chats">Chats</a></li>
        <li>Nuevo chat</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mt-4">Nuevo chat</h1>
    <p class="text-base-content/70 mt-1">Selecciona un contacto para iniciar una conversación</p>

    <input
      type="text"
      class="input input-bordered w-full max-w-md mt-4"
      placeholder="Buscar por nombre..."
      [ngModel]="searchQuery()"
      (ngModelChange)="searchQuery.set($event)"
      name="search"
    />

    @if (contactsResource.isLoading()) {
      <lib-loader />
    } @else {
      <div class="mt-4 space-y-2">
        @for (contact of filteredContacts(); track contact.id) {
          <button
            type="button"
            (click)="contact.id && startChat(contact.id)"
            [disabled]="creating()"
            class="flex items-center gap-3 p-4 rounded-lg bg-base-100 hover:bg-base-200 w-full text-left transition-colors"
          >
            <div class="avatar avatar-placeholder">
              <div class="text-white rounded-full w-10" [style.background]="contact.color || 'oklch(var(--p))'">
                <span>{{ contact.initials }}</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="font-medium">{{ contact.name }}</p>
              <p class="text-sm text-base-content/60">{{ contact.email }}</p>
            </div>
            @if (creating() === contact.id) {
              <span class="loading loading-spinner loading-sm"></span>
            } @else {
              <span class="material-symbols-outlined text-base-content/50">chat</span>
            }
          </button>
        }
        @if (filteredContacts().length === 0) {
          <p class="text-base-content/60 py-8">No se encontraron contactos</p>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatNew {
  #apollo = inject(Apollo);
  #router = inject(Router);
  #toast = inject(Toast);

  searchQuery = signal('');
  creating = signal<string | false>(false);

  contactsResource = rxResource({
    params: () => ({ query: this.searchQuery() }),
    stream: ({ params }) =>
      this.#apollo
        .watchQuery({
          query: ContactsFindContactsDocument,
          variables: { queryText: params.query || undefined },
        })
        .valueChanges.pipe(map((r) => r.data?.findContacts ?? [])),
  });

  filteredContacts() {
    const contacts = this.contactsResource.value() ?? [];
    const me = this.#auth.user()?.id;
    return contacts.filter((c) => c.id !== me);
  }

  #auth = inject(Auth);

  async startChat(recipientId: string) {
    this.creating.set(recipientId);
    try {
      const result = await this.#apollo
        .mutate({
          mutation: ChatsCreateDirectChatDocument,
          variables: { recipientId },
          refetchQueries: [{ query: ChatsMyChatsDocument }],
        })
        .toPromise();
      const chat = result?.data?.createDirectChat;
      if (chat?.id) {
        this.#router.navigate(['/chats', chat.id]);
      }
    } catch (err) {
      console.error(err);
      this.#toast.showError(err instanceof Error ? err.message : 'Error al crear chat');
    } finally {
      this.creating.set(false);
    }
  }
}
