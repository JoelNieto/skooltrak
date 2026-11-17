import { Breadcrumbs, Button, Card, CardBody, TextEditor, Toast, UiChoice, UiField, UiInput, UiToggle } from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Store from '../../core/store';
import { isValidId } from '../../core/validators';

interface NewsletterDto {
  title: string;
  content?: string | null;
  published: boolean;
}

@Component({
  selector: 'app-newsletter-form',
  imports: [
    Breadcrumbs,
    Card,
    CardBody,
    UiChoice,
    UiField,
    UiInput,
    UiToggle,
    Button,
    FormField,
    FormsModule,
    TextEditor,
    RouterLink,
  ],
  template: `
    <ui-breadcrumbs
      [items]="[
        { label: 'Inicio', link: '/' },
        { label: 'Admin', link: '/admin' },
        { label: 'Boletines', link: '/admin/newsletters' },
        { label: isEditMode() ? 'Editar' : 'Nuevo' },
      ]"
    />

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar boletín' : 'Nuevo boletín' }}
      </h1>
    </div>

    <form (submit)="onSubmit($event)" novalidate="novalidate">
      <div class="flex flex-col gap-6 divide-y divide-line">
        <!-- Title & Status Section -->
        <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-ink-strong">Información</h2>
            <p class="mt-1 text-sm text-ink-muted">Título y estado del boletín.</p>
          </div>
          <div class="sm:col-span-3">
            <div uiCard>
              <div uiCardBody class="gap-y-4">
                <ui-field label="Título" [field]="formData.title">
                  <input uiInput type="text" id="title" [formField]="formData.title" />
                </ui-field>
                <ui-choice label="Publicar inmediatamente">
                  <input uiToggle type="checkbox" [(ngModel)]="published" [ngModelOptions]="{ standalone: true }" />
                </ui-choice>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Section -->
        <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-ink-strong">Contenido</h2>
            <p class="mt-1 text-sm text-ink-muted">Redacta el contenido del boletín.</p>
          </div>
          <div class="sm:col-span-3">
            <div uiCard>
              <div uiCardBody>
                <lib-text-editor [bordered]="true" [(ngModel)]="content" [ngModelOptions]="{ standalone: true }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end gap-3 my-6 pt-6 border-t border-line">
        <a uiButton variant="ghost" routerLink="/admin/newsletters">Cancelar</a>
        <button uiButton [loading]="isSaving()" variant="primary" type="submit" [disabled]="isSaving()">
          {{ isEditMode() ? 'Guardar cambios' : 'Crear boletín' }}
        </button>
      </div>
    </form>
  `,
})
export default class NewsletterForm {
  public id = input<string>();

  private toast = inject(Toast);
  private http = inject(HttpClient);
  private router = inject(Router);
  private store = inject(Store);

  content = signal('');
  published = signal(false);
  isSaving = signal(false);

  public isEditMode = computed(() => !!this.id());

  #formValue = signal<{ title: string }>({ title: '' });
  public formData = form(this.#formValue, (schemaPath) => {
    required(schemaPath.title, { message: 'Título es requerido' });
  });

  public newsletterResource = httpResource<NewsletterDto>(() => {
    if (!isValidId(this.id())) return undefined;
    return {
      url: `/api/v1/newsletters/${this.id()}`,
    };
  });

  constructor() {
    afterRenderEffect(() => {
      const newsletter = this.newsletterResource.value();
      if (newsletter) {
        this.#formValue.set({ title: newsletter.title });
        this.content.set(newsletter.content ?? '');
        this.published.set(newsletter.published);
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.formData.title().markAsDirty();

    if (this.formData().invalid()) {
      this.toast.showError('Datos inválidos');
      return;
    }

    submit(this.formData, async () => {
      this.isSaving.set(true);
      const title = this.formData().value().title;
      const content = this.content();
      const published = this.published();
      const schoolId = this.store.currentSchoolId();

      try {
        if (this.isEditMode()) {
          if (!this.id()) {
            this.toast.showError('ID del boletín no válido');
            return;
          }
          await firstValueFrom(
            this.http.patch('/api/v1/newsletters', {
              id: this.id() ?? '',
              title,
              content,
              published,
            }),
          );
          this.toast.showSuccess('Boletín actualizado');
          this.router.navigate(['/admin/newsletters']);
        } else {
          await firstValueFrom(
            this.http.post('/api/v1/newsletters', {
              title,
              content,
              published,
              schoolId: schoolId ?? '',
            }),
          );
          this.toast.showSuccess('Boletín creado');
          this.router.navigate(['/admin/newsletters']);
        }
      } catch (error: any) {
        const message = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al guardar el boletín';
        this.toast.showError(message);
      } finally {
        this.isSaving.set(false);
      }
    });
  }
}
