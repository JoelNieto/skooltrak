import { ChangeDetectionStrategy, Component } from '@angular/core';

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
 * The login page's hero: headline, an animated constellation of the school's actors (desktop),
 * a scrolling activity log (desktop) and a module marquee (tablet / phone).
 * Reads the --lg-* custom properties set by the Login page, so it follows the theme.
 */
@Component({
  selector: 'app-login-hero',
  template: `
    <p class="hero-eyebrow hero-in" style="--d: 0.06s">
      <span class="hero-pulse"></span>Plataforma escolar inteligente
    </p>
    <h1 class="hero-h1 hero-in" style="--d: 0.14s">
      Tu escuela, conectada <span class="hero-accent">en tiempo real</span
      ><span class="hero-caret" aria-hidden="true"></span>
    </h1>
    <p class="hero-sub hero-in" style="--d: 0.22s">
      Calificaciones, asistencia y comunicación en un solo lugar para docentes, estudiantes y familias.
    </p>

    <div class="viz hero-in" style="--d: 0.3s" aria-hidden="true">
      <svg viewBox="0 0 560 400">
        <g class="viz-orbit viz-orbit-1"><circle cx="280" cy="200" r="88" /></g>
        <g class="viz-orbit viz-orbit-2">
          <circle cx="280" cy="200" r="150" />
          <circle class="viz-sat" cx="430" cy="200" r="3.5" />
          <circle class="viz-sat viz-teal" cx="130" cy="200" r="2.5" />
        </g>
        @for (end of ends; track $index) {
          <line class="viz-link" x1="280" y1="200" [attr.x2]="end.x" [attr.y2]="end.y" />
          <line
            class="viz-flow"
            [class.viz-flow-in]="end.inbound"
            x1="280"
            y1="200"
            [attr.x2]="end.x"
            [attr.y2]="end.y"
            [style.animation-delay]="end.delay"
          />
        }
        <circle class="viz-halo" cx="280" cy="200" r="40" />
        <circle class="viz-ring" cx="280" cy="200" r="34" />
        <circle class="viz-ring viz-ring-2" cx="280" cy="200" r="34" />
        <circle class="viz-core" cx="280" cy="200" r="32" />
        <g transform="translate(262 182) scale(0.9)">
          <rect class="viz-face" x="7" y="11" width="26" height="18" rx="9" />
          <circle class="viz-eye" cx="16" cy="20" r="2.6" />
          <circle class="viz-eye" cx="24" cy="20" r="2.6" />
          <rect class="viz-face" x="18" y="5" width="4" height="6" rx="2" />
        </g>
      </svg>
      @for (node of nodes; track node.label) {
        <span class="viz-node" [style.left.%]="node.left" [style.top.%]="node.top" [style.animation-delay]="node.delay">
          <span class="dot" [class.dot-teal]="node.teal"></span>{{ node.label }}
        </span>
      }
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
    .hero-pulse {
      position: relative;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lg-accent);
    }
    .hero-pulse::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--lg-accent);
      animation: ping 2s var(--ui-ease) infinite;
    }
    .hero-h1 {
      margin: 1.125rem 0 0;
      max-width: 39rem;
      font-size: clamp(2.125rem, 4.1vw, 3.5rem);
      line-height: 1.04;
      letter-spacing: -0.04em;
      font-weight: 600;
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

    .viz {
      position: relative;
      width: 100%;
      max-width: 35rem;
      aspect-ratio: 560 / 400;
      margin-top: 1.25rem;
    }
    .viz svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .viz-orbit {
      fill: none;
      stroke: color-mix(in oklab, var(--ui-ink-strong) 16%, transparent);
      transform-box: view-box;
      transform-origin: 280px 200px;
    }
    .viz-orbit-1 {
      stroke-dasharray: 2 7;
      animation: spin 50s linear infinite;
    }
    .viz-orbit-2 {
      stroke: color-mix(in oklab, var(--ui-ink-strong) 10%, transparent);
      animation: spin 34s linear infinite reverse;
    }
    .viz-sat {
      fill: var(--lg-accent);
      stroke: none;
    }
    .viz-teal {
      fill: var(--lg-teal);
    }
    .viz-link {
      stroke: color-mix(in oklab, var(--ui-ink-strong) 12%, transparent);
    }
    .viz-flow {
      stroke: var(--lg-accent);
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-dasharray: 5 15;
      animation: dash 2.2s linear infinite;
    }
    .viz-flow-in {
      stroke: var(--lg-teal);
      animation-direction: reverse;
    }
    .viz-halo {
      fill: color-mix(in oklab, var(--lg-accent) 28%, transparent);
      filter: blur(14px);
    }
    .viz-ring {
      fill: none;
      stroke: var(--lg-accent);
      transform-box: view-box;
      transform-origin: 280px 200px;
      animation: ring 3.2s var(--ui-ease) infinite;
    }
    .viz-ring-2 {
      animation-delay: 1.6s;
    }
    .viz-core {
      fill: var(--ui-surface-1);
      stroke: color-mix(in oklab, var(--lg-accent) 60%, var(--ui-surface-1));
      stroke-width: 1.25;
    }
    .viz-face {
      fill: var(--lg-accent);
    }
    .viz-eye {
      fill: var(--ui-surface-1);
    }
    .viz-node,
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4375rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--ui-line-strong);
      background: var(--lg-chip);
      font: 500 0.75rem/1 var(--lg-mono);
      color: var(--ui-ink);
      white-space: nowrap;
    }
    .viz-node {
      position: absolute;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px -12px var(--lg-shadow);
      transform: translate(-50%, -50%);
      animation: bob 6s ease-in-out infinite;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--lg-accent);
    }
    .dot-teal {
      background: var(--lg-teal);
    }

    .log {
      width: 100%;
      max-width: 29rem;
      height: 72px;
      margin-top: 0.875rem;
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
      color: color-mix(in oklab, var(--lg-teal) 70%, var(--ui-ink-strong));
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
    @keyframes ping {
      to {
        transform: scale(3);
        opacity: 0;
      }
    }
    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -40;
      }
    }
    @keyframes ring {
      from {
        opacity: 0.55;
      }
      to {
        transform: scale(2.6);
        opacity: 0;
      }
    }
    @keyframes bob {
      50% {
        transform: translate(-50%, calc(-50% - 7px));
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
      .viz,
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
  protected readonly ends = [
    { x: 280, y: 40, inbound: false, delay: '0s' },
    { x: 498, y: 120, inbound: true, delay: '-0.6s' },
    { x: 470, y: 340, inbound: false, delay: '-1.1s' },
    { x: 100, y: 340, inbound: true, delay: '-0.3s' },
    { x: 62, y: 120, inbound: false, delay: '-1.5s' },
  ];
  protected readonly nodes = [
    { label: 'Estudiantes', left: 50, top: 10, teal: false, delay: '0s' },
    { label: 'Docentes', left: 89, top: 30, teal: true, delay: '-1.2s' },
    { label: 'Familias', left: 84, top: 85, teal: false, delay: '-2.4s' },
    { label: 'Calificaciones', left: 18, top: 85, teal: true, delay: '-3.6s' },
    { label: 'Asistencia', left: 11, top: 30, teal: false, delay: '-4.8s' },
  ];
  // Doubled so the scrolling animations loop without a jump.
  protected readonly logRows = [...LOG_LINES, ...LOG_LINES];
  protected readonly modules = [...MODULES, ...MODULES];
}

/**
 * The login page's ambient layer: a fading dot grid, two drifting glows and a scan line.
 * Fills the nearest positioned ancestor behind its content.
 */
@Component({
  selector: 'app-login-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="grid"></div>
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>
    <div class="scan"></div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        color-mix(in oklab, var(--ui-ink-strong) 14%, transparent) 1px,
        transparent 1px
      );
      background-size: 28px 28px;
      mask-image: radial-gradient(ellipse 75% 70% at 32% 45%, #000 25%, transparent 78%);
    }
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      animation: drift 18s ease-in-out infinite alternate;
    }
    .glow-a {
      width: 560px;
      height: 560px;
      left: -160px;
      top: -180px;
      background: color-mix(in oklab, var(--lg-accent) var(--lg-glow-a), transparent);
    }
    .glow-b {
      width: 460px;
      height: 460px;
      right: -140px;
      bottom: -200px;
      background: color-mix(in oklab, var(--lg-teal) var(--lg-glow-b), transparent);
      animation-duration: 24s;
      animation-direction: alternate-reverse;
    }
    .scan {
      position: absolute;
      inset: 0 0 auto;
      height: 2px;
      opacity: 0.5;
      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in oklab, var(--lg-accent) 55%, transparent),
        transparent
      );
      animation: scan 8s linear infinite;
    }
    @keyframes drift {
      to {
        transform: translate(80px, 60px) scale(1.12);
      }
    }
    @keyframes scan {
      to {
        transform: translateY(100vh);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .glow,
      .scan {
        animation: none;
      }
    }
  `,
})
export class LoginBackdrop {}
