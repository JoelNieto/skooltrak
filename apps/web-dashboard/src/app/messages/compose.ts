import { TextEditor, Toast } from '#/ui';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  form,
  FormField,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Contacts, { SelectedContact } from './contacts';

interface ComposeFormData {
  to: SelectedContact[];
  subject: string;
  content: string;
}

@Component({
  selector: 'app-compose',
  imports: [RouterLink, Contacts, TextEditor, FormsModule, FormField],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/messages">Mensajes</a></li>
        <li>Nuevo mensaje</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold">Nuevo mensaje</h1>
    <form (submit)="onSubmit($event)">
      <div class="bg-base-100 p-4 rounded-lg border border-base-300 mt-4">
        <div class="flex flex-col gap-1 border-b border-base-300 pb-2">
          <div class="flex gap-2 items-center">
            <label for="to">Para:</label>
            <app-contacts
              [selectedContacts]="formModel().to"
              (selectedContactsChange)="updateRecipients($event)"
            />
          </div>
          @if (composeForm.to().touched() && composeForm.to().invalid()) {
            <ul class="text-error text-sm">
              @for (error of composeForm.to().errors(); track error.kind) {
                <li>{{ error.message }}</li>
              }
            </ul>
          }
        </div>
        <div class="flex flex-col gap-1 py-2 border-b border-base-300">
          <input
            type="text"
            class="input-lg input input-ghost w-full"
            placeholder="Asunto"
            [formField]="composeForm.subject"
          />
          @if (
            composeForm.subject().touched() && composeForm.subject().invalid()
          ) {
            <ul class="text-error text-sm">
              @for (error of composeForm.subject().errors(); track error.kind) {
                <li>{{ error.message }}</li>
              }
            </ul>
          }
        </div>
        <div class="flex flex-col gap-1 border-b border-base-300 py-2">
          <lib-text-editor
            [bordered]="false"
            [(ngModel)]="formModel().content"
            (ngModelChange)="updateContent($event)"
            name="content"
          />
          @if (
            composeForm.content().touched() && composeForm.content().invalid()
          ) {
            <ul class="text-error text-sm">
              @for (error of composeForm.content().errors(); track error.kind) {
                <li>{{ error.message }}</li>
              }
            </ul>
          }
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-ghost" routerLink="/messages">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Enviar</button>
        </div>
      </div>
    </form>`,
})
export default class Compose {
  #http = inject(HttpClient);
  #toast = inject(Toast);
  #router = inject(Router);

  formModel = signal<ComposeFormData>({
    to: [],
    subject: '',
    content: '',
  });

  composeForm = form(this.formModel, (schemaPath) => {
    validate(schemaPath.to, ({ value }) => {
      if (value().length === 0) {
        return {
          kind: 'required',
          message: 'Debe seleccionar al menos un destinatario',
        };
      }
      return null;
    });
    required(schemaPath.subject, {
      message: 'El asunto es requerido',
    });
    minLength(schemaPath.subject, 3, {
      message: 'El asunto debe tener al menos 3 caracteres',
    });
    required(schemaPath.content, {
      message: 'El contenido del mensaje es requerido',
    });
    minLength(schemaPath.content, 10, {
      message: 'El mensaje debe tener al menos 10 caracteres',
    });
  });

  updateRecipients(recipients: SelectedContact[]) {
    this.formModel.update((prev) => ({
      ...prev,
      to: recipients,
    }));
  }

  updateContent(content: string) {
    this.formModel.update((prev) => ({
      ...prev,
      content,
    }));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.composeForm, async () => {
      await new Promise<void>((resolve, reject) => {
        this.#http
          .post('/api/v1/messages', {
            recipientIds: this.formModel().to.map((contact) => contact.id),
            subject: this.formModel().subject,
            content: this.formModel().content,
          })
          .subscribe({
            next: () => {
              this.#toast.showSuccess('Mensaje enviado exitosamente');
              this.#router.navigate(['/messages']);
              resolve();
            },
            error: (err) => {
              console.error(err);
              this.#toast.showError('Error al enviar mensaje');
              reject(err);
            },
          });
      });
    });
  }
}
