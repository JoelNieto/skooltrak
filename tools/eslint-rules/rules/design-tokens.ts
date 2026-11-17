/**
 * design-tokens: keeps Angular templates on the design system (libs/ui).
 *
 * Checks every class a template sets (class="…", [class]/[ngClass] string literals and map keys,
 * [class.x] bindings, routerLinkActive) and reports:
 *
 *   rawPrimitive  DaisyUI component classes that have a libs/ui primitive (btn → uiButton, …).
 *                 Off with `{ primitives: false }`: libs/ui is where those classes are applied.
 *   baseColour    DaisyUI base colours (text-base-content/70, bg-base-200, …) → ink/surface/line tokens.
 *   paletteColour Tailwind palette shades (text-gray-500, bg-indigo-600, …) and solid white/black
 *                 fills → tokens or status colours. text-white and black/white at an opacity
 *                 (photo scrims, text on a user's avatar colour) are allowed.
 *   arbitraryColour  bg-[#123456], text-[oklch(…)] …
 *                 (bg-primary/5, /10, /15 are reported as baseColour: use bg-action-subtle)
 *   darkVariant   dark:… (tokens already switch with the theme).
 *   gradient      bg-linear-*, bg-radial-*, bg-conic-*, from-* / via-* / to-* (the brand uses flat fills;
 *                 component styles are checked by flat-styles).
 *
 * When a DaisyUI component gets a primitive (tabs, avatar, …), add it to PRIMITIVES below.
 * An intentional exception takes an HTML comment with the reason:
 *   <!-- eslint-disable-next-line @nx/workspace-design-tokens -- QR codes need a white quiet zone -->
 */
import { getTemplateParserServices } from '@angular-eslint/utils';
import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

// NOTE: The rule will be available in ESLint configs as "@nx/workspace-design-tokens"
export const RULE_NAME = 'design-tokens';

type Options = [{ primitives?: boolean }];
type MessageIds = 'rawPrimitive' | 'baseColour' | 'paletteColour' | 'arbitraryColour' | 'darkVariant' | 'gradient';

/** DaisyUI classes that have a primitive, and what to use instead. */
export const PRIMITIVES: [RegExp, string][] = [
  [/^btn(-.+)?$/, 'uiButton'],
  [
    /^(input|select|textarea)(-(xs|sm|md|lg|xl|ghost|bordered|primary|secondary|accent|neutral|info|success|warning|error))?$/,
    'uiInput / uiSelect inside ui-field',
  ],
  [/^(fieldset|fieldset-legend|label)$/, 'ui-field'],
  // DaisyUI 4 field wrappers: gone in DaisyUI 5, so they style nothing.
  [/^(form-control|label-text(-alt)?)$/, 'ui-field (DaisyUI 4 class, removed in DaisyUI 5)'],
  [/^(checkbox|radio|toggle)(-.+)?$/, 'uiCheckbox / uiRadio / uiToggle inside ui-choice'],
  [/^badge(-.+)?$/, 'uiBadge'],
  [/^card(-(body|title|actions|border|dash|side|compact|xs|sm|md|lg|xl))?$/, 'uiCard / uiCardBody / uiCardTitle'],
  [/^table(-(zebra|pin-rows|pin-cols|xs|sm|md|lg|xl))?$/, 'table[uiTable]'],
  [/^breadcrumbs$/, 'lib-page-header [breadcrumbs]'],
  [/^loading(-(spinner|dots|ring|ball|bars|infinity|xs|sm|md|lg|xl))?$/, 'uiSpinner'],
  [/^alert(-.+)?$/, 'uiAlert'],
  [/^skeleton$/, 'uiSkeleton (or tbody[uiTableSkeleton] for table rows)'],
  // Material Symbols (icon font) was replaced by Lucide SVGs in DS 13; the font is no longer loaded.
  [/^material-(symbols|icons)(-(outlined|rounded|sharp))?$/, '<ui-icon name="…"> (Lucide)'],
  [
    /^tabs?(-(box|border|lift|lifted|boxed|bordered|active|disabled|content|xs|sm|md|lg|xl|top|bottom))?$/,
    'uiTabs / uiTabList / uiTab / uiTabPanel',
  ],
];

const UTIL =
  '(text|bg|border(-[trblxy])?|divide|ring|ring-offset|outline|from|via|to|fill|stroke|placeholder|decoration|caret|accent|shadow)';
const BASE = new RegExp(`^${UTIL}-base-(100|200|300|content)(/\\d+)?$`);
const PALETTE = new RegExp(
  `^${UTIL}-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}(/\\d+)?$`,
);
const SOLID_WHITE_BLACK = new RegExp(`^${UTIL}-(white|black)$`);
/** Light tints of the action colour: one token, bg-action-subtle (the brand's brand-subtle). */
const ACTION_TINT = /^bg-primary\/(5|10|15)$/;
/** Tailwind gradient utilities and their colour stops. */
const GRADIENT = /^(bg-(linear|radial|conic|gradient)(-.+)?|(from|via|to)-.+)$/;
const ARBITRARY = /^[a-z-]+-\[(#|rgba?\(|hsla?\(|oklch\(|oklab\(|color-mix\()/;

const HINT_BASE =
  'text-base-content[/NN] → text-ink-strong / ink / ink-muted / ink-subtle; bg-base-100/200/300 → bg-surface-1/0/2; border-base-* → border-line';
const HINT_PALETTE =
  'use a token (text-ink-*, bg-surface-*, border-line*, text-action) or a status colour (text-error, bg-success/10, …)';

/** Splits `md:hover:!text-gray-500` into variants and the bare utility. */
function parse(token: string): { variants: string[]; util: string } {
  const parts = token.split(':');
  const util = (parts.pop() ?? '').replace(/^!|!$/g, '');
  return { variants: parts, util };
}

export function check(token: string, primitives: boolean): { messageId: MessageIds; hint: string } | null {
  const { variants, util } = parse(token);
  if (variants.includes('dark')) return { messageId: 'darkVariant', hint: 'tokens already switch with the theme' };
  if (GRADIENT.test(util))
    return { messageId: 'gradient', hint: 'use a flat token fill (bg-surface-*, bg-action-subtle)' };
  if (BASE.test(util)) return { messageId: 'baseColour', hint: HINT_BASE };
  if (PALETTE.test(util)) return { messageId: 'paletteColour', hint: HINT_PALETTE };
  if (SOLID_WHITE_BLACK.test(util) && !/^text-white$/.test(util))
    return { messageId: 'paletteColour', hint: HINT_PALETTE };
  if (ACTION_TINT.test(util))
    return { messageId: 'baseColour', hint: 'selected / highlighted fills use bg-action-subtle' };
  if (ARBITRARY.test(util)) return { messageId: 'arbitraryColour', hint: HINT_PALETTE };
  if (primitives && variants.length === 0) {
    const hit = PRIMITIVES.find(([re]) => re.test(util));
    if (hit) return { messageId: 'rawPrimitive', hint: hit[1] };
  }
  return null;
}

// ── Template AST helpers (duck-typed: the bundled compiler's class names are not a stable API) ──

interface Span {
  start: { offset: number } | number;
  end: { offset: number } | number;
}
interface AttrLike {
  name: string;
  value: unknown;
  type?: number | string;
  __originalType?: number;
  keySpan?: Span;
  valueSpan?: Span;
  sourceSpan: Span;
}
interface ElementLike {
  attributes: AttrLike[];
  inputs: AttrLike[];
}

const CLASS_ATTRS = new Set(['class', 'ngClass', 'routerLinkActive']);
const BINDING_CLASS = 2; // BindingType.Class: [class.foo]
const SKIP_KEYS = new Set(['span', 'sourceSpan', 'nameSpan', 'keySpan', 'valueSpan', 'parent', 'receiver']);

/** String literals, interpolation text and object-literal keys inside a bound expression. */
function strings(node: unknown, out: string[] = [], seen = new Set<unknown>()): string[] {
  if (!node || typeof node !== 'object' || seen.has(node)) return out;
  seen.add(node);
  const n = node as Record<string, unknown>;
  if ('span' in n && typeof n['value'] === 'string') out.push(n['value']);
  if ('span' in n && typeof n['text'] === 'string') out.push(n['text']);
  if (Array.isArray(n['strings']))
    out.push(...(n['strings'] as unknown[]).filter((s): s is string => typeof s === 'string'));
  if (Array.isArray(n['keys']))
    for (const k of n['keys'] as { key?: unknown }[]) if (typeof k?.key === 'string') out.push(k.key);
  for (const [key, value] of Object.entries(n)) if (!SKIP_KEYS.has(key)) strings(value, out, seen);
  return out;
}

export const rule = ESLintUtils.RuleCreator(() => __filename)<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Templates use libs/ui primitives and design tokens instead of raw DaisyUI classes and palette colours.',
    },
    schema: [
      {
        type: 'object',
        properties: { primitives: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
    messages: {
      rawPrimitive: '`{{cls}}` is a raw DaisyUI class; use {{hint}} from #/ui.',
      baseColour: '`{{cls}}` bypasses the design tokens: {{hint}}.',
      paletteColour: '`{{cls}}` is a fixed palette colour: {{hint}}.',
      arbitraryColour: '`{{cls}}` hard-codes a colour: {{hint}}.',
      darkVariant: '`{{cls}}`: {{hint}}; drop the dark: variant and use a token.',
      gradient: '`{{cls}}` draws a gradient; the brand uses flat fills: {{hint}}.',
    },
  },
  defaultOptions: [{ primitives: true }],
  create(context, [{ primitives = true }]) {
    const services = getTemplateParserServices(context as never);
    const reported = new Set<string>();

    function report(cls: string, span: Span) {
      const found = check(cls, primitives);
      if (!found) return;
      const loc = services.convertNodeSourceSpanToLoc(span as never) as TSESTree.SourceLocation;
      const key = `${loc.start.line}:${loc.start.column}:${cls}`;
      if (reported.has(key)) return;
      reported.add(key);
      context.report({ loc, messageId: found.messageId, data: { cls, hint: found.hint } });
    }

    function visit(node: ElementLike) {
      for (const attr of node.attributes ?? []) {
        if (!CLASS_ATTRS.has(attr.name) || typeof attr.value !== 'string') continue;
        for (const cls of attr.value.split(/\s+/).filter(Boolean)) report(cls, attr.valueSpan ?? attr.sourceSpan);
      }
      for (const input of node.inputs ?? []) {
        if ((input.__originalType ?? input.type) === BINDING_CLASS) {
          report(input.name, input.keySpan ?? input.sourceSpan);
        } else if (CLASS_ATTRS.has(input.name)) {
          for (const s of strings(input.value))
            for (const cls of s.split(/\s+/).filter(Boolean)) report(cls, input.valueSpan ?? input.sourceSpan);
        }
      }
    }

    return {
      Element: visit,
      Template: visit,
    } as never;
  },
});
