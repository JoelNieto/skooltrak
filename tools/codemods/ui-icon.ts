/**
 * Codemod: Material Symbols (icon font) → <ui-icon> (Lucide SVG) from `#/ui`.
 *
 *   bun tools/codemods/ui-icon.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-icon.ts --dry <file.ts> [...more]  # report only
 *
 * Names are translated with tools/codemods/material-to-lucide.json.
 *   <span class="material-symbols-outlined text-xl">delete</span>  → <ui-icon name="trash-2" class="text-xl" />
 *   <span class="material-symbols-outlined">{{ row.icon }}</span>   → <ui-icon [name]="row.icon" />
 *   icon="group" / actionIcon="add" on any element                 → the Lucide name
 *   'check_circle' in TS icon data (`icon: '…'`, functions named *Icon*) → 'circle-check'
 * A span's aria-hidden is dropped (ui-icon hides itself unless it has a label); other attributes
 * and bindings are kept. Registers Icon in every @Component that uses <ui-icon>. Reports names it
 * can't map instead of guessing. Idempotent.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MAP: Record<string, string> = JSON.parse(readFileSync(join(import.meta.dir, 'material-to-lucide.json'), 'utf8'));
const ELEMENT = /<(span|i|div)\b([^>]*?)\bclass="([^"]*\bmaterial-symbols-outlined\b[^"]*)"([^>]*)>([^<]*)<\/\1\s*>/g;

interface Report {
  icons: number;
  data: number;
  unmapped: string[];
}

/** Translates quoted Material names inside an expression or a block of TS. */
function translateLiterals(text: string, report: Report): string {
  return text.replace(/'([a-z][a-z0-9_]*)'/g, (all, name: string) => {
    if (MAP[name]) {
      report.data++;
      return `'${MAP[name]}'`;
    }
    return all;
  });
}

function convertElements(src: string, report: Report): string {
  return src.replace(ELEMENT, (all, _tag, before: string, cls: string, after: string, body: string) => {
    const classes = cls.split(/\s+/).filter((c) => c && c !== 'material-symbols-outlined');
    const attrs = `${before} ${after}`
      .replace(/\s*aria-hidden="true"/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const text = body.trim();
    let nameAttr: string;
    const binding = /^\{\{\s*([\s\S]+?)\s*\}\}$/.exec(text);
    if (binding) {
      nameAttr = `[name]="${translateLiterals(binding[1].replace(/\s+/g, ' '), report).replace(/"/g, "'")}"`;
    } else if (MAP[text]) {
      nameAttr = `name="${MAP[text]}"`;
    } else {
      report.unmapped.push(text || '(empty)');
      return all;
    }
    report.icons++;
    const parts = ['<ui-icon', nameAttr];
    if (classes.length) parts.push(`class="${classes.join(' ')}"`);
    if (attrs) parts.push(attrs);
    return parts.join(' ') + ' />';
  });
}

/** icon="group" / actionIcon="add" / [icon]="'group'" attribute values. */
function convertIconInputs(src: string, report: Report): string {
  return src
    .replace(/(\s(?:[a-z][a-zA-Z]*)?[iI]con=")([a-z][a-z0-9_]*)"/g, (all, pre: string, name: string) => {
      if (!MAP[name]) return all;
      report.data++;
      return `${pre}${MAP[name]}"`;
    })
    .replace(
      /(\s\[(?:[a-z][a-zA-Z]*)?[iI]con\]=")([^"]*)"/g,
      (_all, pre: string, expr: string) => `${pre}${translateLiterals(expr, report)}"`,
    );
}

/** Icon data in TS: `icon: '…'` / `icon = '…'` lines and the bodies of functions named *Icon*. */
function convertData(src: string, report: Report): string {
  let out = src.replace(/^.*\b\w*[iI]con\w*\s*[:=(].*$/gm, (line) =>
    /^\s*(import|\/\/|\*)/.test(line) ? line : translateLiterals(line, report),
  );
  // Bodies of methods/functions named *Icon* (brace-matched; a lazy regex backtracks badly here).
  const head = /\b\w*Icon\w*\s*\([^)\n]*\)\s*(?::\s*[^{\n]+)?\{/g;
  let result = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = head.exec(out))) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let close = -1;
    for (let i = open; i < out.length; i++) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}' && --depth === 0) {
        close = i;
        break;
      }
    }
    if (close < 0) break;
    result += out.slice(last, open) + translateLiterals(out.slice(open, close + 1), report);
    last = close + 1;
    head.lastIndex = close + 1;
  }
  return result + out.slice(last);
}

function registerIcon(src: string, file: string): string {
  if (!/<ui-icon\b/.test(src)) return src;
  const inLib = file.includes('libs/ui/src/lib/ui/components/');
  const from = inLib ? './icon' : '#/ui';
  const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace(/[./#]/g, '\\$&')}';`).exec(src);
  if (existing) {
    if (!/\bIcon\b/.test(existing[1])) {
      const names = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        'Icon',
      ].sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${names.join(', ')} } from '${from}';`);
    }
  } else {
    const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
    const last = imports[imports.length - 1];
    const pos = last ? last.index! + last[0].length : 0;
    src = src.slice(0, pos) + `import { Icon } from '${from}';\n` + src.slice(pos);
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    if (!/<ui-icon\b/.test(body)) return block;
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      if (/\bIcon\b/.test(arr[1])) return block;
      return block.replace(arr[0], `imports: [${arr[1].trim().replace(/,\s*$/, '')}${arr[1].trim() ? ', ' : ''}Icon]`);
    }
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [Icon],`) : block;
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const total: Report = { icons: 0, data: 0, unmapped: [] };
for (const file of files) {
  if (/components\/icon(\.spec)?\.ts$|icons\/icons\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { icons: 0, data: 0, unmapped: [] };
  let out = convertElements(src, report);
  out = convertIconInputs(out, report);
  out = convertData(out, report);
  out = registerIcon(out, file);
  if (report.unmapped.length) total.unmapped.push(...report.unmapped.map((u) => `${file}: ${u}`));
  if (out === src) continue;
  if (!dry) writeFileSync(file, out);
  total.icons += report.icons;
  total.data += report.data;
  console.log(`${file}: ${report.icons} icons, ${report.data} names in data`);
}
if (total.unmapped.length) console.log(`\nunmapped (left as they are):\n  ${total.unmapped.join('\n  ')}`);
console.log(`\ntotal: ${total.icons} icons, ${total.data} names in data${dry ? ' (dry run)' : ''}`);
