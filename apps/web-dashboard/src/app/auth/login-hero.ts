import { Component } from '@angular/core';

/** Decorative activity lines for the log (aria-hidden; not real data). */
const LOG_LINES = [
  { key: 'asistencia.sync', scope: 'grupo 7°A', status: 'ok' },
  { key: 'calificaciones.push', scope: 'Matemáticas', status: 'ok' },
  { key: 'mensajes.enviar', scope: 'familias', status: 'entregado' },
  { key: 'horario.update', scope: 'lunes', status: 'ok' },
  { key: 'tareas.publicar', scope: 'Ciencias', status: 'ok' },
  { key: 'reportes.generar', scope: 'periodo', status: 'listo' },
];

const MODULES = ['Asistencia', 'Calificaciones', 'Mensajes', 'Horarios', 'Tareas', 'Reportes'];

/**
 * The login page's hero: headline, the brand's track motif (desktop), a scrolling activity log
 * (desktop) and a module marquee (tablet / phone).
 *
 * Follows the brand system: flat fills, no gradients or shadows. The lanes are the track from the
 * mark; Runner Orange marks the current position on it, one of the uses the brand reserves for it.
 * Reads the --lg-* custom properties set by the Login page, so it follows the theme and the school's
 * colour. The log and marquee keep an edge fade: a mask that only clips scrolling content.
 */
@Component({
  selector: 'app-login-hero',
  template: `
    <p class="hero-eyebrow hero-in" style="--d: 0.06s"><span class="hero-dot"></span>Plataforma escolar inteligente</p>
    <h1 class="hero-h1 hero-in" style="--d: 0.14s">
      Tu escuela, conectada <span class="hero-accent">en tiempo real</span
      ><span class="hero-caret" aria-hidden="true"></span>
    </h1>
    <p class="hero-sub hero-in" style="--d: 0.22s">
      Calificaciones, asistencia y comunicación en un solo lugar para docentes, estudiantes y familias.
    </p>

    <div class="track hero-in" style="--d: 0.3s" aria-hidden="true">
      @for (lane of lanes; track lane.label) {
        <div class="lane" [class.lane-ink]="lane.ink" [style.width.%]="lane.width" [style.margin-left.%]="lane.offset">
          {{ lane.label }}
        </div>
      }
      <span class="runner"></span>
    </div>

    <div class="log hero-in" style="--d: 0.38s" aria-hidden="true">
      <div class="log-track">
        @for (row of logRows; track $index) {
          <div class="log-row">
            <span>›</span><span class="log-key">{{ row.key }}</span
            ><span>{{ row.scope }}</span
            ><span class="log-ok">{{ row.status }}</span>
          </div>
        }
      </div>
    </div>

    <div class="marquee hero-in" style="--d: 0.26s" aria-hidden="true">
      <div class="marquee-track">
        @for (module of modules; track $index) {
          <span class="chip"><span class="dot"></span>{{ module }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 0;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      margin: 0;
      font: 500 0.75rem/1 var(--lg-mono);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ui-ink);
    }
    .hero-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lg-accent);
    }
    .hero-h1 {
      margin: 1.125rem 0 0;
      max-width: 39rem;
      font-size: clamp(2.125rem, 4.1vw, 3.5rem);
      line-height: 1.04;
      font-weight: 700;
    }
    .hero-accent {
      color: var(--lg-accent-ink);
    }
    .hero-caret {
      display: inline-block;
      width: 0.09em;
      height: 0.82em;
      margin-left: 0.08em;
      vertical-align: -0.04em;
      border-radius: 2px;
      background: var(--lg-accent);
      animation: blink 1.1s steps(1) infinite;
    }
    .hero-sub {
      margin: 1.125rem 0 0;
      max-width: 31rem;
      font-size: 1.0625rem;
      line-height: 1.55;
      color: var(--ui-ink-muted);
    }

    /* The track: three pill lanes, the runner out ahead on the shortest one. */
    .track {
      position: relative;
      width: 100%;
      max-width: 30rem;
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .lane {
      height: 3.25rem;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 0 1.375rem;
      border-radius: 9999px;
      background: var(--lg-accent);
      color: var(--ui-action-content);
      font: 500 0.8125rem/1 var(--lg-mono);
    }
    .lane-ink {
      background: var(--ui-ink-strong);
      color: var(--ui-surface-1);
    }
    .runner {
      position: absolute;
      bottom: 0;
      left: calc(64% - 1.625rem);
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: var(--ui-new);
      box-shadow: 0 0 0 0.375rem var(--ui-surface-0);
      animation: run 6s var(--ui-ease) infinite alternate;
    }

    .log {
      width: 100%;
      max-width: 29rem;
      height: 72px;
      margin-top: 1.75rem;
      overflow: hidden;
      mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent);
    }
    .log-track {
      animation: scroll-y 14s linear infinite;
    }
    .log-row {
      display: grid;
      grid-template-columns: 16px minmax(0, 1.3fr) minmax(0, 1fr) auto;
      gap: 0.625rem;
      height: 24px;
      align-items: center;
      font: 400 0.78rem/1 var(--lg-mono);
      color: var(--ui-ink-muted);
    }
    .log-key {
      color: var(--lg-accent-ink);
    }
    .log-ok {
      color: var(--color-success);
    }

    .marquee {
      display: none;
      width: 100%;
      max-width: 27.5rem;
      margin-top: 1.375rem;
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
    }
    .marquee-track {
      display: flex;
      gap: 0.5rem;
      width: max-content;
      animation: scroll-x 22s linear infinite;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4375rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--ui-line);
      background: var(--ui-surface-1);
      font: 500 0.75rem/1 var(--lg-mono);
      color: var(--ui-ink);
      white-space: nowrap;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--lg-accent);
    }

    .hero-in {
      opacity: 0;
      transform: translateY(16px);
      animation: up 0.9s var(--ui-ease) forwards;
      animation-delay: var(--d, 0s);
    }
    @keyframes up {
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
    @keyframes run {
      from {
        transform: translateX(-9rem);
      }
    }
    @keyframes scroll-y {
      to {
        transform: translateY(-50%);
      }
    }
    @keyframes scroll-x {
      to {
        transform: translateX(-50%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation: none !important;
      }
      .hero-in {
        opacity: 1;
        transform: none;
      }
    }
    @media (max-width: 1024px) {
      :host {
        align-items: center;
        text-align: center;
      }
      .track,
      .log {
        display: none;
      }
      .marquee {
        display: block;
      }
    }
    @media (max-width: 560px) {
      .hero-sub {
        display: none;
      }
      .hero-h1 {
        font-size: 2.125rem;
      }
      .marquee {
        margin-top: 1.125rem;
      }
    }
  `,
})
export class LoginHero {
  protected readonly lanes = [
    { label: 'Asistencia', width: 92, offset: 0, ink: false },
    { label: 'Calificaciones', width: 76, offset: 12, ink: true },
    { label: 'Mensajes', width: 60, offset: 4, ink: false },
  ];
  // Doubled so the scrolling animations loop without a jump.
  protected readonly logRows = [...LOG_LINES, ...LOG_LINES];
  protected readonly modules = [...MODULES, ...MODULES];
}
