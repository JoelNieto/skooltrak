import { TextEditor, Toast } from '@/ui';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, of } from 'rxjs';
import Store from '../../core/store';

@Component({
  selector: 'app-newsletter-form',
  imports: [FormField, FormsModule, TextEditor, RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/admin">Admin</a></li>
        <li><a routerLink="/admin/newsletters">Boletines</a></li>
        @if (isEditMode()) {
          <li>Editar</li>
        } @else {
          <li>Nuevo</li>
        }
      </ul>
    </div>

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode() ? 'Editar boletín' : 'Nuevo boletín' }}
      </h1>
    </div>

    <form (submit)="onSubmit($event)" novalidate="novalidate">
      <div class="flex flex-col gap-6 divide-y divide-base-300">
        <!-- Title & Status Section -->
        <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-base-content">
              Información
            </h2>
            <p class="mt-1 text-sm text-base-content/70">
              Título y estado del boletín.
            </p>
          </div>
          <div class="sm:col-span-3">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body gap-y-4">
                <div class="fieldset">
                  <label for="title">Título</label>
                  <input
                    type="text"
                    id="title"
                    [formField]="formData.title"
                    class="input input-primary w-full"
                    [class.ng-dirty]="formData.title().dirty()"
                    [class.ng-invalid]="formData.title().invalid()"
                  />
                  @if (formData.title().invalid() && formData.title().dirty()) {
                    <ul>
                      @for (error of formData.title().errors(); track error) {
                        <li class="text-error text-sm">{{ error.message }}</li>
                      }
                    </ul>
                  }
                </div>
                <div class="fieldset">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      [(ngModel)]="published"
                      [ngModelOptions]="{standalone: true}"
                    />
                    <span>Publicar inmediatamente</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Section -->
        <div class="sm:grid sm:grid-cols-4 sm:gap-4 pb-8 pt-6">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-base-content">
              Contenido
            </h2>
            <p class="mt-1 text-sm text-base-content/70">
              Redacta el contenido del boletín.
            </p>
          </div>
          <div class="sm:col-span-3">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body">
                <lib-text-editor [bordered]="true" [(ngModel)]="content" [ngModelOptions]="{standalone: true}" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end gap-3 my-6 pt-6 border-t border-base-300">
        <a routerLink="/admin/newsletters" class="btn btn-ghost">Cancelar</a>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="isSaving()"
        >
          @if (isSaving()) {
            <span class="loading loading-spinner loading-sm"></span>
          }
          {{ isEditMode() ? 'Guardar cambios' : 'Crear boletín' }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewsletterForm {
  public id = input<string>();

  private toast = inject(Toast);
  private apollo = inject(Apollo);
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

  public newsletterResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      if (!params.id) {
        return of(null);
      }
      return this.apollo
        .watchQuery<{
          newsletter: {
            id: string;
            title: string;
            content: string;
            published: boolean;
          };
        }>({
          query: gql`
            query GetNewsletter($id: String!) {
              newsletter(id: $id) {
                id
                title
                content
                published
              }
            }
          `,
          variables: { id: params.id },
        })
        .valueChanges.pipe(map((result) => result.data.newsletter));
    },
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
          await firstValueFrom(
            this.apollo.mutate({
              mutation: gql`
                mutation UpdateNewsletter(
                  $updateNewsletterInput: UpdateNewsletterInput!
                ) {
                  updateNewsletter(
                    updateNewsletterInput: $updateNewsletterInput
                  ) {
                    id
                  }
                }
              `,
              variables: {
                updateNewsletterInput: {
                  id: this.id(),
                  title,
                  content,
                  published,
                },
              },
            }),
          );
          this.toast.showSuccess('Boletín actualizado');
          this.router.navigate(['/admin/newsletters']);
        } else {
          await firstValueFrom(
            this.apollo.mutate({
              mutation: gql`
                mutation CreateNewsletter(
                  $createNewsletterInput: CreateNewsletterInput!
                ) {
                  createNewsletter(
                    createNewsletterInput: $createNewsletterInput
                  ) {
                    id
                  }
                }
              `,
              variables: {
                createNewsletterInput: {
                  title,
                  content,
                  published,
                  schoolId,
                },
              },
            }),
          );
          this.toast.showSuccess('Boletín creado');
          this.router.navigate(['/admin/newsletters']);
        }
      } catch (error: any) {
        const message =
          error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          'Error al guardar el boletín';
        this.toast.showError(message);
      } finally {
        this.isSaving.set(false);
      }
    });
  }
}
