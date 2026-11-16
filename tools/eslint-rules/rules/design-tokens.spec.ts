import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { check, rule, RULE_NAME } from './design-tokens';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@angular-eslint/template-parser'),
  },
} as RuleTesterConfig);

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // tokens, primitives and layout utilities
    `<p class="text-ink-muted bg-surface-1 border-line hover:bg-surface-2 text-action">x</p>`,
    `<button uiButton variant="primary" class="w-full">Guardar</button>`,
    `<span uiBadge tone="success">Activo</span>`,
    // status colours and DaisyUI semantic colours stay allowed
    `<p class="text-error bg-success/10 text-primary-content bg-neutral text-neutral-content">x</p>`,
    // white text on a user's avatar colour, scrims over photos
    `<div class="text-white" [style.background]="color"></div>`,
    `<div class="bg-black/40 from-black/60 bg-white/10 border-white/20"></div>`,
    // Tailwind table layout utilities are not DaisyUI's table
    `<div class="table-fixed table-auto"></div>`,
    // dynamic class expressions: only literals are checked
    `<p [class]="statusClass()"></p>`,
    `<p [ngClass]="{ 'font-semibold': unread }"></p>`,
    // inside libs/ui the primitives apply DaisyUI classes themselves
    { code: `<button class="btn btn-primary"></button>`, options: [{ primitives: false }] },
  ],
  invalid: [
    {
      code: `<button class="btn btn-primary w-full">Guardar</button>`,
      errors: [{ messageId: 'rawPrimitive' }, { messageId: 'rawPrimitive' }],
    },
    {
      code: `<p class="text-base-content/70 hover:bg-base-200">x</p>`,
      errors: [{ messageId: 'baseColour' }, { messageId: 'baseColour' }],
    },
    {
      code: `<p class="text-gray-500 md:bg-indigo-600 !border-slate-200">x</p>`,
      errors: [{ messageId: 'paletteColour' }, { messageId: 'paletteColour' }, { messageId: 'paletteColour' }],
    },
    { code: `<div class="bg-white"></div>`, errors: [{ messageId: 'paletteColour' }] },
    { code: `<div class="bg-[#3b82f6]"></div>`, errors: [{ messageId: 'arbitraryColour' }] },
    { code: `<div class="text-ink dark:text-white"></div>`, errors: [{ messageId: 'darkVariant' }] },
    // bound class sources
    { code: `<tr [class.bg-base-200]="unread"></tr>`, errors: [{ messageId: 'baseColour' }] },
    {
      code: `<p [ngClass]="{ 'text-gray-500': muted, 'badge badge-sm': true }"></p>`,
      errors: [{ messageId: 'paletteColour' }, { messageId: 'rawPrimitive' }, { messageId: 'rawPrimitive' }],
    },
    {
      code: `<p [class]="ok ? 'text-success' : 'text-red-500'"></p>`,
      errors: [{ messageId: 'paletteColour' }],
    },
    {
      code: `<a routerLinkActive="bg-white/15 text-gray-900" [routerLinkActive]="['dark:text-white']"></a>`,
      errors: [{ messageId: 'paletteColour' }, { messageId: 'darkVariant' }],
    },
    { code: `<p class="px-2 {{ extra }} text-gray-400"></p>`, errors: [{ messageId: 'paletteColour' }] },
    // tokens are still checked inside libs/ui
    {
      code: `<p class="text-slate-500"></p>`,
      options: [{ primitives: false }],
      errors: [{ messageId: 'paletteColour' }],
    },
    // control flow blocks and ng-template
    {
      code: `@if (x) { <span class="loading loading-spinner"></span> }<ng-template><div class="card"></div></ng-template>`,
      errors: [{ messageId: 'rawPrimitive' }, { messageId: 'rawPrimitive' }, { messageId: 'rawPrimitive' }],
    },
  ],
});

describe('check()', () => {
  it.each([
    ['input-sm', 'rawPrimitive'],
    ['fieldset-legend', 'rawPrimitive'],
    ['form-control', 'rawPrimitive'],
    ['label-text', 'rawPrimitive'],
    ['toggle-success', 'rawPrimitive'],
    ['table-zebra', 'rawPrimitive'],
    ['tabs-box', 'rawPrimitive'],
    ['tab-active', 'rawPrimitive'],
    ['tab-content', 'rawPrimitive'],
    ['ring-offset-base-100', 'baseColour'],
    ['bg-primary/10', 'baseColour'],
    ['hover:bg-primary/5', 'baseColour'],
    ['text-black', 'paletteColour'],
  ])('%s → %s', (cls, messageId) => {
    expect(check(cls, true)?.messageId).toBe(messageId);
  });

  it.each([
    'text-white',
    'tab-size-4',
    'avatar',
    'hover:btn',
    'table-cell',
    'text-ink-strong',
    'bg-surface-0/60',
    'bg-primary/20',
    'bg-action-subtle',
    'bg-new',
  ])('%s is allowed', (cls) => expect(check(cls, true)).toBeNull());
});
