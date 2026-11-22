import { Alert, Button, courseColorVar, CourseCover, Icon, Toast } from '#/ui';
import { COURSE_COLORS } from '@/shared';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const COVER_MAX_BYTES = 2 * 1024 * 1024;
const COVER_RULE = 'La portada debe ser una imagen JPEG, PNG o WebP de hasta 2 MB';

/**
 * "Personalizar" a course (ACA-001 FR .3): its teacher or an admin sets its color and uploads or
 * removes its cover photo (BR .12). Closes with `true` when something changed.
 */
@Component({
  selector: 'app-course-customize-dialog',
  imports: [Alert, Button, CourseCover, Icon],
  template: `
    <div class="flex flex-col gap-5">
      <ui-course-cover [color]="color()" [icon]="data().icon" [image]="coverUrl()" />

      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-semibold text-ink-strong">Color</legend>
        <div class="flex flex-wrap gap-1">
          @for (c of colors; track c.key) {
            <label class="relative flex size-11 cursor-pointer items-center justify-center" [title]="c.label">
              <input
                type="radio"
                name="customize-color"
                class="peer sr-only"
                [value]="c.key"
                [checked]="color() === c.key"
                (change)="pickColor(c.key)"
                [attr.aria-label]="c.label"
              />
              <span
                class="flex size-9 items-center justify-center rounded-full ring-ink-strong ring-offset-2 ring-offset-surface-1 peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-action"
                [style.background-color]="colorVar(c.key)"
              >
                @if (color() === c.key) {
                  <ui-icon name="check" class="text-lg text-white" />
                }
              </span>
            </label>
          }
        </div>
        <p class="text-xs text-ink-muted">Se ve en las tarjetas del curso y como punto junto a su nombre.</p>
      </fieldset>

      <section aria-labelledby="customize-cover" class="flex flex-col gap-2">
        <h3 id="customize-cover" class="text-sm font-semibold text-ink-strong">Foto de portada</h3>
        <p class="text-xs text-ink-muted">JPEG, PNG o WebP, hasta 2 MB. Reemplaza el color en las tarjetas.</p>
        <div class="flex flex-wrap gap-2">
          <label uiButton variant="secondary" size="sm" class="cursor-pointer" [class.opacity-50]="busy()">
            <ui-icon name="upload" />
            {{ coverUrl() ? 'Cambiar foto' : 'Subir foto' }}
            <input
              type="file"
              class="sr-only"
              accept="image/jpeg,image/png,image/webp"
              [disabled]="busy()"
              (change)="upload($event)"
              aria-label="Subir foto de portada"
            />
          </label>
          @if (coverUrl()) {
            <button uiButton variant="ghost" size="sm" type="button" [disabled]="busy()" (click)="removeCover()">
              <ui-icon name="trash-2" />
              Quitar foto
            </button>
          }
        </div>
        @if (error(); as message) {
          <div uiAlert tone="danger">
            <span>{{ message }}</span>
          </div>
        }
      </section>

      <div class="flex justify-end">
        <button uiButton variant="primary" type="button" (click)="closeModal.emit(changed())">Listo</button>
      </div>
    </div>
  `,
})
export default class CourseCustomizeDialog implements OnInit {
  readonly data = input.required<{ courseId: string; color: string; icon: string | null; coverUrl: string | null }>();
  readonly closeModal = output<boolean>();
  #http = inject(HttpClient);
  #toast = inject(Toast);

  protected readonly colors = COURSE_COLORS;
  protected readonly colorVar = courseColorVar;
  protected readonly color = signal('');
  protected readonly coverUrl = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly changed = signal(false);
  protected readonly url = computed(() => `/api/v1/courses/${this.data().courseId}`);

  ngOnInit(): void {
    this.color.set(this.data().color);
    this.coverUrl.set(this.data().coverUrl);
  }

  protected async pickColor(color: string): Promise<void> {
    const previous = this.color();
    this.color.set(color);
    try {
      await firstValueFrom(this.#http.patch(`${this.url()}/appearance`, { color }));
      this.changed.set(true);
    } catch (e) {
      this.color.set(previous);
      this.#toast.showError(message(e, 'No se pudo cambiar el color'));
    }
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!COVER_TYPES.includes(file.type) || file.size > COVER_MAX_BYTES) {
      this.error.set(COVER_RULE);
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await firstValueFrom(this.#http.post<{ coverUrl: string | null }>(`${this.url()}/cover`, form));
      this.coverUrl.set(res.coverUrl);
      this.changed.set(true);
    } catch (e) {
      this.error.set(message(e, 'No se pudo subir la foto'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async removeCover(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.#http.delete(`${this.url()}/cover`));
      this.coverUrl.set(null);
      this.changed.set(true);
    } catch (e) {
      this.error.set(message(e, 'No se pudo quitar la foto'));
    } finally {
      this.busy.set(false);
    }
  }
}

function message(error: unknown, fallback: string): string {
  const body = error instanceof HttpErrorResponse ? error.error : null;
  return typeof body?.message === 'string' ? body.message : fallback;
}
