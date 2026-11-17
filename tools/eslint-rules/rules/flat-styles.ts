/**
 * flat-styles: component `styles` follow the brand's "no gradients anywhere, flat fills only".
 *
 * Reports linear-, radial- and conic-gradient() (and their repeating- forms) inside the `styles` of an
 * Angular @Component. Allowed: a gradient used as a mask (mask, mask-image), which only fades the
 * edge of scrolling content and paints nothing. Class lists in templates are checked by
 * design-tokens (bg-linear-*, from-*, via-*, to-*).
 *
 * An intentional exception takes a comment with the reason:
 *   // eslint-disable-next-line @nx/workspace-flat-styles -- …
 */
import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

// NOTE: The rule will be available in ESLint configs as "@nx/workspace-flat-styles"
export const RULE_NAME = 'flat-styles';

const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/g;
const MASK_PROPERTIES = new Set(['mask', 'mask-image', '-webkit-mask', '-webkit-mask-image']);

/** The CSS property whose value contains `index` in `css` ('' when it can't tell). */
export function propertyAt(css: string, index: number): string {
  const start = Math.max(css.lastIndexOf(';', index), css.lastIndexOf('{', index), css.lastIndexOf('}', index));
  const declaration = css.slice(start + 1, index);
  const colon = declaration.indexOf(':');
  return colon < 0 ? '' : declaration.slice(0, colon).trim().toLowerCase();
}

/** Offsets of gradients in `css` that are not masks. */
export function findGradients(css: string): number[] {
  const hits: number[] = [];
  for (const m of css.matchAll(GRADIENT)) {
    if (!MASK_PROPERTIES.has(propertyAt(css, m.index))) hits.push(m.index);
  }
  return hits;
}

export const rule = ESLintUtils.RuleCreator(() => __filename)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Component styles use flat fills: no gradients except masks that fade scrolling content.',
    },
    schema: [],
    messages: {
      gradient:
        'Gradients are off-brand ("no gradients anywhere, flat fills only"): use a flat token fill. A mask-image fade on scrolling content is allowed.',
    },
  },
  defaultOptions: [],
  create(context) {
    const source = context.sourceCode;

    function check(node: TSESTree.Node) {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        // The raw text starts with its quote, so offsets in the value are one character in.
        for (const offset of findGradients(node.value)) {
          context.report({ node, loc: locAt(node.range[0] + 1 + offset), messageId: 'gradient' });
        }
      } else if (node.type === 'TemplateLiteral') {
        for (const quasi of node.quasis) {
          const raw = quasi.value.raw;
          for (const offset of findGradients(raw)) {
            context.report({ node: quasi, loc: locAt(quasi.range[0] + 1 + offset), messageId: 'gradient' });
          }
        }
      } else if (node.type === 'ArrayExpression') {
        for (const el of node.elements) if (el) check(el);
      }
    }

    function locAt(index: number) {
      const start = source.getLocFromIndex(index);
      return { start, end: { line: start.line, column: start.column + 1 } };
    }

    return {
      'Decorator > CallExpression[callee.name="Component"] > ObjectExpression > Property[key.name="styles"]'(
        node: TSESTree.Property,
      ) {
        check(node.value);
      },
    };
  },
});
