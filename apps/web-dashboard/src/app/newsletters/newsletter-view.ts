import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isValidId } from '../core/validators';

type NewsletterDetail = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  publishedAt: string;
  author: { id: string; name: string };
  school: { id: string; name: string };
};

@Component({
  selector: 'app-newsletter-view',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Boletín</li>
      </ul>
    </div>

    @if (newsletter.isLoading()) {
      <div class="flex items-center justify-center py-16">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    } @else if (newsletter.error()) {
      <div class="alert alert-error mt-4">
        <span class="material-symbols-outlined">error</span>
        <span>No se pudo cargar el boletín.</span>
        <a routerLink="/home" class="btn btn-sm btn-ghost">Volver al inicio</a>
      </div>
    } @else if (newsletter.value(); as item) {
      @if (item?.id) {
      <article class="mx-auto max-w-3xl">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-base-content">{{ item.title }}</h1>
          <div class="mt-3 flex items-center gap-2 text-sm text-base-content/60">
            <span class="material-symbols-outlined text-base">person</span>
            <span>{{ item.author?.name }}</span>
            <span class="mx-1">·</span>
            <span class="material-symbols-outlined text-base">calendar_today</span>
            <span>{{ item.publishedAt | date: 'longDate' }}</span>
            <span class="mx-1">·</span>
            <span class="material-symbols-outlined text-base">apartment</span>
            <span>{{ item.school?.name }}</span>
          </div>
        </header>

        <div class="prose prose-sm max-w-none newsletter-content" [innerHTML]="item.content"></div>

        <div class="mt-10 pt-6 border-t border-base-300">
          <a routerLink="/home" class="btn btn-ghost btn-sm">
            <span class="material-symbols-outlined text-base">arrow_back</span>
            Volver al inicio
          </a>
        </div>
      </article>
    } @else {
      <div>No se encontró el boletín</div>
    }
    }
  `,
  styles: `
    .newsletter-content {
      font-size: 0.95rem;
      line-height: 1.75;
    }
    .newsletter-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 1.5rem 0 0.75rem;
    }
    .newsletter-content h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 1.25rem 0 0.5rem;
    }
    .newsletter-content h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem;
    }
    .newsletter-content p {
      margin-bottom: 0.75rem;
    }
    .newsletter-content ul,
    .newsletter-content ol {
      padding-left: 1.5rem;
      margin-bottom: 0.75rem;
      list-style: revert;
    }
    .newsletter-content ol {
      list-style-type: decimal;
    }
    .newsletter-content blockquote {
      border-left: 4px solid color-mix(in oklch, var(--color-primary) 40%, transparent);
      padding-left: 1rem;
      font-style: italic;
      color: color-mix(in oklch, var(--color-base-content) 70%, transparent);
      margin: 1rem 0;
    }
    .newsletter-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    .newsletter-content table td,
    .newsletter-content table th {
      border: 1px solid var(--color-neutral-300);
      padding: 0.5rem 0.75rem;
    }
    .newsletter-content table td p,
    .newsletter-content table th p {
      margin: 0;
      margin-bottom: 0;
    }
    .newsletter-content table th {
      background-color: var(--color-base-200);
      font-weight: 600;
      text-align: left;
    }
    .newsletter-content code {
      background-color: var(--color-base-200);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewsletterView {
  public id = input.required<string>();

  public newsletter = httpResource<NewsletterDetail | null>(() => {
    const id = this.id();
    if (!isValidId(id)) return undefined;
    return `/api/v1/newsletters/${id}`;
  });
}
