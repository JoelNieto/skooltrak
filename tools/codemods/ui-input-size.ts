/**
 * Codemod: DaisyUI size/style classes on form controls → primitive inputs.
 *
 *   bun tools/codemods/ui-input-size.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-input-size.ts --dry <file.ts> [...more]  # report only
 *
 *   <input uiInput class="input-sm w-20">     → <input uiInput size="sm" class="w-20">
 *   <select uiSelect class="select-xs">       → <select uiSelect size="xs">
 *   <input uiInput class="input-lg input-ghost"> → <input uiInput size="lg" ghost>
 *   <label class="input input-primary input-lg"> → <label uiInputGroup size="lg">   (icon + bare input)
 *
 * input-primary / input-bordered / select-bordered / input-md are dropped (the primitive's default
 * look). Registers UiInputGroup in every @Component that uses it. Idempotent.
 */
import { readFileSync, writeFileSync } from 'fs';

const SIZE = /^(input|select|textarea)-(xs|sm|md|lg)$/;
const DROP = new Set(['input-primary', 'input-bordered', 'select-bordered', 'select-primary', 'textarea-primary']);

/** End index of the opening tag starting at `start` (quote-aware). */
function tagEnd(src: string, start: number): number {
  for (let i = start, q: string | null = null; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === '>') return i;
  }
  return -1;
}

function rewriteTag(tag: string, name: string, counts: { controls: number; groups: number }): string {
  const cls = /\sclass="([^"]*)"/.exec(tag);
  if (!cls) return tag;
  const tokens = cls[1].split(/\s+/).filter(Boolean);
  const isControl = /\suiInput\b|\suiSelect\b/.test(tag);
  const isGroup = !isControl && (name === 'label' || name === 'div') && tokens.includes('input');
  if (!isControl && !isGroup) return tag;

  let size: string | null = null;
  let ghost = false;
  const keep = tokens.filter((t) => {
    const m = SIZE.exec(t);
    if (m) {
      if (m[2] !== 'md') size = m[2];
      return false;
    }
    if (t === 'input-ghost' || t === 'textarea-ghost') return !(ghost = true);
    if (DROP.has(t)) return false;
    if (isGroup && t === 'input') return false;
    return true;
  });
  if (keep.length === tokens.length && !isGroup) return tag;

  const attrs = [isGroup ? 'uiInputGroup' : '', size ? `size="${size}"` : '', ghost ? 'ghost' : ''].filter(Boolean);
  let out = tag.replace(cls[0], keep.length ? ` class="${keep.join(' ')}"` : '');
  if (isGroup) {
    out = out.replace(new RegExp(`^<${name}`), `<${name} ${attrs.join(' ')}`);
    counts.groups++;
  } else {
    out = out.replace(/(\suiInput|\suiSelect)\b/, `$1${attrs.length ? ' ' + attrs.join(' ') : ''}`);
    counts.controls++;
  }
  return out;
}

function registerGroup(src: string): string {
  if (!/\suiInputGroup\b/.test(src)) return src;
  const ui = /import \{([^}]*)\} from '#\/ui';/.exec(src);
  if (ui && !/\bUiInputGroup\b/.test(ui[1])) {
    const names = [
      ...ui[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      'UiInputGroup',
    ].sort((a, b) => a.localeCompare(b));
    src = src.replace(ui[0], `import { ${names.join(', ')} } from '#/ui';`);
  } else if (!ui) {
    const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
    const last = imports[imports.length - 1];
    const pos = last ? last.index! + last[0].length : 0;
    src = src.slice(0, pos) + `import { UiInputGroup } from '#/ui';\n` + src.slice(pos);
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    if (!/\suiInputGroup\b/.test(body)) return block;
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      if (/\bUiInputGroup\b/.test(arr[1])) return block;
      return block.replace(arr[0], `imports: [${arr[1].trim().replace(/,\s*$/, '')}, UiInputGroup]`);
    }
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [UiInputGroup],`) : block;
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const total = { controls: 0, groups: 0 };
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const counts = { controls: 0, groups: 0 };
  let out = '';
  let i = 0;
  const re = /<(input|select|textarea|label|div)(?=[\s>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const end = tagEnd(src, m.index);
    if (end < 0) break;
    out += src.slice(i, m.index) + rewriteTag(src.slice(m.index, end + 1), m[1], counts);
    i = end + 1;
    re.lastIndex = end + 1;
  }
  out = registerGroup(out + src.slice(i));
  if (out === src) continue;
  if (!dry) writeFileSync(file, out);
  total.controls += counts.controls;
  total.groups += counts.groups;
  console.log(`${file}: ${counts.controls} controls, ${counts.groups} input groups`);
}
console.log(`\ntotal: ${total.controls} controls, ${total.groups} input groups${dry ? ' (dry run)' : ''}`);
