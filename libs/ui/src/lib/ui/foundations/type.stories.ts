import type { Meta, StoryObj } from '@storybook/angular';

/** The brand system's type scale as utilities (libs/ui/src/styles/theme.css, "Type scale"). */
const STYLES = [
  {
    cls: 'type-display',
    spec: 'Space Grotesk 700 · 48/52 (36/40 on phones)',
    use: 'Heroes, onboarding, empty-state headlines',
    sample: 'Tu semana escolar, al día',
  },
  {
    cls: 'type-heading-lg',
    spec: 'Space Grotesk 700 · 32/38 (26/32 on phones)',
    use: 'Screen titles (lib-page-header)',
    sample: '7° A · Esta semana',
  },
  { cls: 'type-heading-md', spec: 'Space Grotesk 500 · 22/28', use: 'Section titles', sample: 'Próximas actividades' },
  {
    cls: 'type-body-lg',
    spec: 'Geist 400 · 18/28',
    use: 'Message bodies and announcements',
    sample: 'La gira al Biomuseo es el viernes. Traigan merienda y gorra.',
  },
  {
    cls: 'type-body',
    spec: 'Geist 400 · 16/24',
    use: 'Descriptions, reading text, form fields',
    sample: 'Entregar el permiso firmado antes del jueves, 3:00 p. m.',
  },
  {
    cls: 'type-label',
    spec: 'Geist 600 · 14/20',
    use: 'Buttons, tabs, form labels, list titles',
    sample: 'Marcar como leído',
  },
  {
    cls: 'type-caption',
    spec: 'Geist 500 · 12/16 · +0.02em',
    use: 'Timestamps and metadata, ink-muted or stronger',
    sample: 'Enviado 9:41 a. m. · Prof. Rivera',
  },
  { cls: 'type-code', spec: 'Geist Mono 400 · 13/20', use: 'Codes and identifiers', sample: 'MAT-7A-2026' },
];

const meta: Meta = {
  title: 'Foundations/Type',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const Scale: Story = {
  render: () => ({
    props: { styles: STYLES },
    template: `
      <div class="flex max-w-3xl flex-col divide-y divide-line">
        @for (s of styles; track s.cls) {
          <div class="grid gap-2 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
            <div class="flex flex-col gap-1">
              <code class="type-code text-ink-strong">{{ s.cls }}</code>
              <span class="type-caption text-ink-muted">{{ s.spec }}</span>
              <span class="text-xs text-ink-muted">{{ s.use }}</span>
            </div>
            <p [class]="s.cls + ' text-ink-strong min-w-0'">{{ s.sample }}</p>
          </div>
        }
      </div>
    `,
  }),
};

/** Headings take Space Grotesk from the base style; their size comes from a type-* style or utilities. */
export const Headings: Story = {
  render: () => ({
    template: `
      <div class="flex max-w-2xl flex-col gap-4 text-ink-strong">
        <h1 class="type-heading-lg">Calificaciones del periodo</h1>
        <h2 class="type-heading-md">Matemáticas · 7° A</h2>
        <h3 class="text-lg font-semibold">Tareas pendientes</h3>
        <p class="type-body text-ink">Las notas se publican al cerrar el periodo. Revisa las tareas pendientes antes del viernes.</p>
      </div>
    `,
  }),
};
