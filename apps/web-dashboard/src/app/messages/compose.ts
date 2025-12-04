import { TextEditor, Toast } from '@/ui';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import Contacts, { SelectedContact } from './contacts';

@Component({
  selector: 'app-compose',
  imports: [RouterLink, Contacts, TextEditor, FormsModule],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/messages">Mensajes</a></li>
        <li>Nuevo mensaje</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold">Nuevo mensaje</h1>
    <form>
      <div class="bg-base-100 p-4 rounded-lg border border-base-300 mt-4">
        <div class="flex gap-2 items-center border-b border-base-300 pb-2">
          <label for="to">Para:</label>
          <app-contacts
            [selectedContacts]="form().to"
            (selectedContactsChange)="updateRecipients($event)"
          />
        </div>
        <div class="flex gap-2 items-center py-2 border-b border-base-300 pb-2">
          <input
            type="text"
            class="input-lg input input-ghost"
            placeholder="Asunto"
            name="subject"
            [(ngModel)]="form().subject"
          />
        </div>
        <div class="flex gap-2 items-center border-b border-base-300 py-2">
          <lib-text-editor
            [bordered]="false"
            [(ngModel)]="form().content"
            name="content"
          />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn btn-ghost">Cancelar</button>
          <button class="btn btn-primary" (click)="onSubmit()">Enviar</button>
        </div>
      </div>
    </form>`,
})
export default class Compose {
  #apollo = inject(Apollo);
  #toast = inject(Toast);
  #router = inject(Router);
  form = signal<{
    to: SelectedContact[];
    subject: string;
    content: string;
  }>({
    to: [],
    subject: '',
    content: '',
  });
  updateRecipients(recipients: SelectedContact[]) {
    this.form.update((prev) => ({
      ...prev,
      to: recipients,
    }));
  }

  onSubmit() {
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
            recipientIds: this.form().to.map((contact) => contact.id),
            subject: this.form().subject,
            content: this.form().content,
          },
        },
      })
      .subscribe({
        next: () => {
          this.#toast.showSuccess('Mensaje enviado exitosament');
          this.#router.navigate(['/messages']);
        },
        error: (err) => {
          console.error(err);
          this.#toast.showError('Error al enviar mensaje');
        },
      });
  }
}
