import { Button, Card, CardBody, CardTitle, Toast, UiInputGroup } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { debounce, email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-magic-link-request',
  imports: [Card, CardBody, CardTitle, Button, RouterLink, FormField, UiInputGroup],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <div uiCard class="w-full max-w-md">
        <div uiCardBody>
          <h2 uiCardTitle class="text-2xl justify-center">Acceso sin contraseña</h2>
          <p class="text-center text-ink-muted mb-4">Ingresa tu correo y te enviaremos un enlace de acceso único.</p>

          <form (submit)="request($event)" class="flex flex-col gap-4">
            <label uiInputGroup class="w-full">
              <span class="material-symbols-outlined">email</span>
              <input type="email" placeholder="correo@ejemplo.com" [formField]="emailForm.email" />
            </label>
            @if (emailForm.email().touched() && emailForm.email().invalid()) {
              <ul class="error-list">
                @for (error of emailForm.email().errors(); track error) {
                  <li class="text-error text-sm">{{ error.message }}</li>
                }
              </ul>
            }

            <button
              uiButton
              [loading]="loading()"
              variant="primary"
              type="submit"
              class="w-full"
              [disabled]="loading()"
            >
              @if (!loading()) {
                <span class="material-symbols-outlined">link</span>
              }
              {{ loading() ? 'Enviando...' : 'Enviar enlace de acceso' }}
            </button>
          </form>

          <div class="divider">o</div>

          <p class="text-center text-sm">
            <a routerLink="/login" class="link link-primary">Volver al inicio de sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export default class MagicLinkRequest {
  model = signal({ email: '' });
  loading = signal(false);
  emailForm = form(this.model, (schema) => {
    debounce(schema.email, 300);
    required(schema.email, { message: 'Por favor, ingresa un correo válido.' });
    email(schema.email, { message: 'Por favor, ingresa un correo válido.' });
  });

  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(Toast);

  async request(event: Event) {
    event.preventDefault();
    if (this.loading()) return;
    this.loading.set(true);
    if (this.emailForm().invalid()) {
      this.toast.showError('Por favor, ingresa un correo válido.');
      this.loading.set(false);
      return;
    }

    const email = this.model().email;

    this.http.post('/api/v1/auth/magic-link/request', { email: email }).subscribe({
      next: () => {
        this.toast.showSuccess('Si el correo existe, recibirás un enlace de acceso en unos minutos.');
      },
      error: (err) => {
        console.error('Error requesting magic link', { err });
      },
      complete: () => {
        this.router.navigate(['/login']);
        this.loading.set(false);
      },
    });
  }
}
