import { Loader, Toast } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from '../auth/auth';

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
            <div class="flex-1 min-w-0">
              <p class="font-medium">{{ contact.name }}</p>
              <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span class="text-sm text-base-content/60">{{ contact.email }}</span>
                @if (roleLabel(contact?.role?.name); as label) {
                  <span class="badge badge-secondary badge-soft badge-sm">{{ label }}</span>
                }
                @if (contact?.student?.classGroup?.name; as groupName) {
                  <span class="badge badge-outline badge-primary badge-sm">{{ groupName }}</span>
                }
              </div>
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
  #http = inject(HttpClient);
  #router = inject(Router);
  #toast = inject(Toast);

  searchQuery = signal('');
  creating = signal<string | false>(false);

  contactsResource = httpResource<
    Array<{
      id: string;
      name?: string;
      email?: string;
      color?: string | null;
      initials?: string;
      role?: { name?: string | null };
      student?: { classGroup?: { name?: string | null } | null };
    }>
  >(() => ({
    url: '/api/v1/messages/contacts',
    params: { query: this.searchQuery() },
    defaultValue: [],
  }));

  filteredContacts() {
    const contacts = this.contactsResource.value() ?? [];
    const me = this.#auth.user()?.id;
    return contacts.filter((c) => c.id !== me);
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

  #auth = inject(Auth);

  async startChat(recipientId: string) {
    this.creating.set(recipientId);
    try {
      const chat = await firstValueFrom(this.#http.post<{ id: string }>(`/api/v1/chats/direct`, { recipientId }));
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
