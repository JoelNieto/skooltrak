import type { Meta, StoryObj } from '@storybook/angular';
import { Paginator } from './paginator';
import { PaginatorV2 } from './paginator-v2';

type PaginatorArgs = { take: number; skip: number; count: number };

const meta: Meta<PaginatorArgs> = {
  title: 'Components/Paginator',
  argTypes: {
    take: { control: { type: 'number', min: 1 } },
    skip: { control: { type: 'number', min: 0 } },
    count: { control: { type: 'number', min: 0 } },
  },
  args: { take: 10, skip: 0, count: 245 },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [Paginator] },
    template: `<lib-paginator [(skip)]="skip" [(take)]="take" [count]="count" />`,
  }),
};

export default meta;
type Story = StoryObj<PaginatorArgs>;

/** `Paginator`: offset based (`skip` / `take` / `count`), two-way bound. */
export const Offset: Story = {};

export const FewPages: Story = { args: { count: 42 } };

export const MiddleOfManyPages: Story = { args: { skip: 120 } };

export const LastPage: Story = { args: { skip: 240 } };

type PaginatorV2Args = { page: number; pageSize: number; total: number };

/** `PaginatorV2`: page based (`page` / `pageSize` / `total`), two-way bound. */
export const PageBased: StoryObj<PaginatorV2Args> = {
  name: 'Page based (v2)',
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    pageSize: { control: { type: 'number', min: 1 } },
    total: { control: { type: 'number', min: 0 } },
  },
  args: { page: 1, pageSize: 20, total: 530 },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [PaginatorV2] },
    template: `<lib-paginator [(page)]="page" [(pageSize)]="pageSize" [total]="total" />`,
  }),
};
