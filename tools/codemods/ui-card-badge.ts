/**
 * Codemod: DaisyUI card and badge classes → the `uiCard*` / `uiBadge` primitives from `#/ui`.
 *
 *   bun tools/codemods/ui-card-badge.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-card-badge.ts --dry <file.ts> [...more]  # report only
 *
 * Cards (any element; the host keeps its tag):
 *   card → uiCard, dropping what uiCard now owns: bg-base-100, border, border-base-200/300,
 *     border-neutral-300, card-border, card-bordered, shadow*, rounded-*.
 *     cursor-pointer, hover:shadow-*, hover:border-* or a (click) handler → `interactive`
 *     (links and buttons get it automatically); their transition-* / duration-* classes go too.
 *   card-body → uiCardBody · card-title → uiCardTitle · card-actions → uiCardActions
 *   Other classes (layout, spacing, bg-base-200, border-primary…) stay and still win over uiCard.
 * Badges (element with the `badge` class):
 *   badge-primary/accent → tone="action" · badge-info/success/warning → that tone ·
 *   badge-error → tone="danger" · badge-secondary/neutral/ghost/none → neutral (default, omitted) ·
 *   badge-xs/sm → size="sm" · style classes (soft, outline, dash) are dropped: uiBadge has one style.
 *
 * Leaves an element untouched (and reports it) when it has dynamic class bindings ([class],
 * [ngClass], [class.badge-*], interpolated class) or classes without a clear mapping (card-side,
 * card-compact, image-full, card sizes, badge-lg/xl). Then adds the primitives to the TypeScript
 * imports and to `@Component({ imports: [...] })`.
 */
import { readFileSync, writeFileSync } from 'fs';

type Primitive = 'Card' | 'CardBody' | 'CardTitle' | 'CardActions' | 'Badge';
const MODULE: Record<Primitive, string> = {
  Card: './card',
  CardBody: './card',
  CardTitle: './card',
  CardActions: './card',
  Badge: './badge',
};

interface Report {
  cards: number;
  parts: number;
  badges: number;
  skipped: { line: number; reason: string; snippet: string }[];
  used: Set<Primitive>;
}

/** Finds the end of a start tag, skipping '>' inside quoted attribute values (e.g. arrow functions). */
function startTagEnd(src: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }
  return -1;
}

const CARD_OWNED = new Set([
  'card',
  'bg-base-100',
  'border',
  'border-base-200',
  'border-base-300',
  'border-neutral-300',
  'card-border',
  'card-bordered',
  'shadow',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
  'shadow-2xl',
  'rounded',
  'rounded-md',
  'rounded-lg',
  'rounded-xl',
  'rounded-2xl',
  'rounded-box',
]);
const CARD_UNMAPPED = /^(card-side|card-compact|image-full|card-(xs|sm|md|lg|xl)|card-dash)$/;
const INTERACTIVE_HINT = /^(cursor-pointer|hover:shadow(-\w+)?|hover:border(-[\w/-]+)?)$/;
const INTERACTIVE_SUPPORT = /^(transition(-\w+)?|duration-\d+)$/;

const BADGE_TONE: Record<string, string | null> = {
  'badge-primary': 'action',
  'badge-accent': 'action',
  'badge-info': 'info',
  'badge-success': 'success',
  'badge-warning': 'warning',
  'badge-error': 'danger',
  'badge-secondary': null,
  'badge-neutral': null,
  'badge-ghost': null,
};
const BADGE_DROPPED = new Set(['badge', 'badge-soft', 'badge-outline', 'badge-dash', 'badge-md']);

type Rewrite =
  | { attrs: string[]; rest: string[]; used: Primitive[]; kind: 'card' | 'part' | 'badge' }
  | { skip: string }
  | null;

/** Maps one element's static classes; null when it has nothing this codemod handles. */
function rewrite(tagName: string, startTag: string, tokens: string[]): Rewrite {
  const has = (t: string) => tokens.includes(t);
  const dynamic = /\[ngClass\]|\[class\]=|\[class\.(card|badge)/.test(startTag) || tokens.some((t) => t.includes('{{'));

  if (has('badge')) {
    if (dynamic) return { skip: 'badge: dynamic class binding' };
    const own = tokens.filter((t) => t === 'badge' || t.startsWith('badge-'));
    const unknown = own.find(
      (t) => !BADGE_DROPPED.has(t) && !(t in BADGE_TONE) && !['badge-xs', 'badge-sm'].includes(t),
    );
    if (unknown) return { skip: `badge: unmapped ${unknown}` };
    const tones = own.map((t) => BADGE_TONE[t]).filter((t): t is string => !!t);
    if (new Set(tones).size > 1) return { skip: 'badge: several colours' };
    const attrs = ['uiBadge'];
    if (tones[0]) attrs.push(`tone="${tones[0]}"`);
    if (has('badge-xs') || has('badge-sm')) attrs.push('size="sm"');
    return { attrs, rest: tokens.filter((t) => !own.includes(t)), used: ['Badge'], kind: 'badge' };
  }

  if (has('card')) {
    if (dynamic) return { skip: 'card: dynamic class binding' };
    const unmapped = tokens.find((t) => CARD_UNMAPPED.test(t));
    if (unmapped) return { skip: `card: unmapped ${unmapped}` };
    const interactive = tokens.some((t) => INTERACTIVE_HINT.test(t)) || /\s\(click\)=/.test(startTag);
    const autoInteractive = tagName === 'a' || tagName === 'button';
    const rest = tokens.filter(
      (t) =>
        !CARD_OWNED.has(t) &&
        !INTERACTIVE_HINT.test(t) &&
        !(interactive && INTERACTIVE_SUPPORT.test(t)) &&
        !/^hover:shadow/.test(t),
    );
    const attrs = ['uiCard'];
    if (interactive && !autoInteractive) attrs.push('interactive');
    const used: Primitive[] = ['Card'];
    // a card that is also its own body (`card card-body`) is rare but valid
    if (has('card-body')) {
      attrs.push('uiCardBody');
      used.push('CardBody');
    }
    return { attrs, rest: rest.filter((t) => t !== 'card-body'), used, kind: 'card' };
  }

  const parts: [string, string, Primitive][] = [
    ['card-body', 'uiCardBody', 'CardBody'],
    ['card-title', 'uiCardTitle', 'CardTitle'],
    ['card-actions', 'uiCardActions', 'CardActions'],
  ];
  const found = parts.filter(([cls]) => has(cls));
  if (!found.length) return null;
  if (dynamic) return { skip: 'card part: dynamic class binding' };
  return {
    attrs: found.map(([, attr]) => attr),
    rest: tokens.filter((t) => !found.some(([cls]) => cls === t)),
    used: found.map(([, , p]) => p),
    kind: 'part',
  };
}

function convert(src: string, report: Report): string {
  let out = '';
  let i = 0;
  const re = /<([a-z][\w-]*)(?=[\s>/])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const end = startTagEnd(src, start);
    if (end < 0) break;
    re.lastIndex = end + 1;
    const startTag = src.slice(start, end + 1);
    const classMatch = /(\s+)class="([^"]*)"/.exec(startTag);
    if (!classMatch || !/(^|\s)(card|badge)(\s|$|-)/.test(classMatch[2])) continue;
    if (/\s(uiCard\w*|uiBadge)[\s=>/]/.test(startTag)) continue;

    const result = rewrite(m[1], startTag, classMatch[2].trim().split(/\s+/));
    if (!result) continue;
    if ('skip' in result) {
      report.skipped.push({
        line: src.slice(0, start).split('\n').length,
        reason: result.skip,
        snippet: startTag.replace(/\s+/g, ' ').slice(0, 140),
      });
      continue;
    }
    let tag = startTag.replace(
      classMatch[0],
      result.rest.length ? `${classMatch[1]}class="${result.rest.join(' ')}"` : '',
    );
    tag = tag.replace(new RegExp(`^<${m[1]}`), `<${m[1]} ${result.attrs.join(' ')}`);
    out += src.slice(i, start) + tag;
    i = end + 1;
    report[result.kind === 'card' ? 'cards' : result.kind === 'part' ? 'parts' : 'badges']++;
    result.used.forEach((p) => report.used.add(p));
  }
  return out + src.slice(i);
}

function addImports(src: string, file: string, names: Primitive[]): string {
  const inUiLib = file.includes('libs/ui/src/');
  const groups = new Map<string, Primitive[]>();
  for (const n of names) {
    const from = inUiLib ? MODULE[n] : '#/ui';
    if (new RegExp(`import \\{[^}]*\\b${n}\\b[^}]*\\} from '${from}'`).test(src)) continue;
    groups.set(from, [...(groups.get(from) ?? []), n]);
  }
  for (const [from, missing] of groups) {
    const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace(/[./]/g, '\\$&')}';`).exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...missing,
      ];
      all.sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '${from}';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { ${[...missing].sort().join(', ')} } from '${from}';\n` + src.slice(pos);
    }
  }
  // Every @Component in the file gets the primitives its own template uses.
  src = src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    const needed = names.filter((n) => usesPrimitive(body, n));
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      const missing = needed.filter((n) => !new RegExp(`\\b${n}\\b`).test(arr[1]));
      if (!missing.length) return block;
      const current = arr[1].trim().replace(/,\s*$/, '');
      return block.replace(arr[0], `imports: [${[...missing, current].filter(Boolean).join(', ')}]`);
    }
    if (!needed.length) return block;
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [${needed.join(', ')}],`) : block;
  });
  return src;
}

const MARKERS: Record<Primitive, RegExp> = {
  Card: /\suiCard[\s=>/]/,
  CardBody: /\suiCardBody\b/,
  CardTitle: /\suiCardTitle\b/,
  CardActions: /\suiCardActions\b/,
  Badge: /\suiBadge\b/,
};
const usesPrimitive = (componentBody: string, name: Primitive) => MARKERS[name].test(componentBody);

/** Primitives whose attribute appears in a component template but that the component doesn't import. */
function unregistered(src: string): string[] {
  const missing: string[] = [];
  for (const m of src.matchAll(/@Component\(\{([\s\S]*?)\n\}\)/g)) {
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(m[1])?.[1] ?? '';
    for (const name of Object.keys(MARKERS) as Primitive[])
      if (usesPrimitive(m[1], name) && !new RegExp(`\\b${name}\\b`).test(arr)) missing.push(name);
  }
  return missing;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const totals = { cards: 0, parts: 0, badges: 0, skipped: 0 };
const notRegistered: string[] = [];
for (const file of files) {
  if (/components\/(card|badge)(\.spec)?\.ts$|\.stories\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { cards: 0, parts: 0, badges: 0, skipped: [], used: new Set() };
  let out = convert(src, report);
  if (report.used.size) out = addImports(out, file, [...report.used].sort() as Primitive[]);
  const missing = unregistered(out);
  if (missing.length) notRegistered.push(`${file}: ${missing.join(', ')}`);
  if (!dry && out !== src) writeFileSync(file, out);

  totals.cards += report.cards;
  totals.parts += report.parts;
  totals.badges += report.badges;
  totals.skipped += report.skipped.length;
  if (report.cards + report.parts + report.badges + report.skipped.length === 0) continue;
  console.log(
    `${file}: ${report.cards} cards, ${report.parts} card parts, ${report.badges} badges; ${report.skipped.length} left for review`,
  );
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(
  `\ntotal: ${totals.cards} cards, ${totals.parts} card parts, ${totals.badges} badges converted; ` +
    `${totals.skipped} left for review${dry ? ' (dry run)' : ''}`,
);
if (notRegistered.length) {
  console.error(`\nPrimitives used but not in @Component imports (they would render unstyled):`);
  for (const f of notRegistered) console.error(`  ${f}`);
  process.exitCode = 1;
}
