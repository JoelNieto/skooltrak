import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';
import { StatCard } from './stat-card';

const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'neutral'];

export default {
  title: 'Components/Display',
} satisfies Meta;

export const PageHeaderStory: StoryObj<PageHeader> = {
  name: 'Page header',
  render: (args) => ({
    props: args,
    template: `<lib-page-header [title]="title" [subtitle]="subtitle" [breadcrumbs]="breadcrumbs" [actionLabel]="actionLabel" [actionIcon]="actionIcon" (action)="action()" />`,
    moduleMetadata: { imports: [PageHeader] },
  }),
  args: {
    title: 'Cursos',
    subtitle: 'Administra los cursos del periodo actual',
    breadcrumbs: [{ label: 'Inicio', link: '/' }, { label: 'Administración', link: '/admin' }, { label: 'Cursos' }],
    actionLabel: 'Nuevo curso',
    actionIcon: 'add',
    action: fn() as never,
  },
};

export const EmptyStateStory: StoryObj<EmptyState> = {
  name: 'Empty state',
  argTypes: { color: { control: 'select', options: colors } },
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-md">
        <lib-empty-state [title]="title" [description]="description" [icon]="icon" [color]="color" [actionLabel]="actionLabel" (action)="action()" />
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
  args: {
    title: 'Sin tareas',
    description: 'Aún no hay tareas asignadas para este curso.',
    icon: 'assignment',
    color: 'primary',
    actionLabel: 'Crear tarea',
    action: fn() as never,
  },
};

export const StatCards: StoryObj = {
  name: 'Stat cards',
  render: () => ({
    template: `
      <div class="grid max-w-3xl gap-4 sm:grid-cols-3">
        <lib-stat-card label="Estudiantes" value="1,248" helper="+32 este mes" icon="groups" color="primary" />
        <lib-stat-card label="Asistencia" value="94.2%" helper="Promedio semanal" icon="event_available" color="success" />
        <lib-stat-card label="Pendientes" value="17" helper="Tareas sin calificar" icon="pending_actions" color="warning" />
      </div>
    `,
    moduleMetadata: { imports: [StatCard] },
  }),
};
