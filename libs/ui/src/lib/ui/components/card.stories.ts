import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardActions, CardBody, CardTitle } from './card';

const meta: Meta<Card> = {
  title: 'Primitives/Card',
  component: Card,
  decorators: [moduleMetadata({ imports: [Card, CardBody, CardTitle, CardActions, Button, Badge] })],
  parameters: {
    docs: {
      description: {
        component:
          'Attribute directives (`uiCard`, `uiCardBody`, `uiCardTitle`, `uiCardActions`) so the host keeps its element. Surface token, hairline border, no shadow.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Card>;

export const Basic: Story = {
  render: () => ({
    template: `
      <section uiCard class="max-w-md">
        <div uiCardBody>
          <h2 uiCardTitle>Asistencia de hoy</h2>
          <p class="text-sm text-ink-muted">28 de 31 estudiantes presentes en 7° A.</p>
          <div uiCardActions>
            <button uiButton variant="ghost" type="button">Más tarde</button>
            <button uiButton variant="primary" type="button">Tomar asistencia</button>
          </div>
        </div>
      </section>
    `,
  }),
};

/** Links and buttons are interactive automatically: stronger border on hover, focus ring. */
export const Interactive: Story = {
  render: () => ({
    template: `
      <div class="grid max-w-3xl gap-4 sm:grid-cols-3">
        @for (course of courses; track course.name) {
          <a uiCard href="#" (click)="$event.preventDefault()">
            <div uiCardBody>
              <h3 uiCardTitle>{{ course.name }}</h3>
              <p class="text-sm text-ink-muted">{{ course.group }}</p>
              <div><span uiBadge size="sm" [tone]="course.tone">{{ course.status }}</span></div>
            </div>
          </a>
        }
      </div>
    `,
    props: {
      courses: [
        { name: 'Matemáticas', group: '7° A', status: 'Al día', tone: 'success' },
        { name: 'Ciencias', group: '7° B', status: '3 pendientes', tone: 'warning' },
        { name: 'Historia', group: '8° A', status: 'Sin notas', tone: 'neutral' },
      ],
    },
  }),
};

/** A card without `uiCardBody` has no padding, for tables and lists that run edge to edge. */
export const EdgeToEdge: Story = {
  render: () => ({
    template: `
      <div uiCard class="max-w-xl overflow-hidden">
        <table class="table">
          <thead><tr><th>Estudiante</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td>María González</td><td><span uiBadge size="sm" tone="success">Presente</span></td></tr>
            <tr><td>Juan Pérez</td><td><span uiBadge size="sm" tone="warning">Tarde</span></td></tr>
            <tr><td>Camila Ortiz</td><td><span uiBadge size="sm" tone="danger">Falta</span></td></tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};
