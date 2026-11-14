/**
 * Codemod: raw DaisyUI form markup → the field primitives from `#/ui`.
 *
 *   bun tools/codemods/ui-field.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-field.ts --dry <file.ts> [...more]  # report only
 *
 * Three passes, each converting only shapes it fully understands and reporting the rest:
 *
 * 1. `<div class="fieldset …">` holding one <label> and one control (+ an optional error block)
 *      <div class="fieldset md:col-span-2">
 *        <label for="name">Nombre <span class="text-xs">(opcional)</span></label>
 *        <input id="name" class="input input-primary" [formField]="form.name"
 *               [class.ng-invalid]="form.name().touched() && form.name().invalid()" />
 *        @if (form.name().touched() && form.name().invalid()) {
 *          @for (error of form.name().errors(); track error) { <p class="text-error">{{ error.message }}</p> }
 *        }
 *      </div>
 *    →
 *      <ui-field label="Nombre" [field]="form.name" optional class="md:col-span-2">
 *        <input id="name" uiInput [formField]="form.name" />
 *      </ui-field>
 *    Checkboxes/toggles in a fieldset become <ui-choice> (label beside the control). The error block
 *    is dropped only when it just prints the bound field's own error messages (as <p>s or a <ul>):
 *    ui-field shows the first one once the field is touched. A static helper <p> becomes `hint`.
 *
 * 2. `<label class="… cursor-pointer …">` wrapping one checkbox/toggle and one text <span>
 *    → <ui-choice label="…"><input … uiCheckbox|uiToggle /></ui-choice>
 *
 * 3. Any remaining <input>/<select>/<textarea> with DaisyUI control classes → uiInput / uiSelect /
 *    uiCheckbox / uiToggle / uiRadio. Classes map so the control looks the same: `*-primary` →
 *    default tone, no colour class → tone="neutral", `*-success|warning|error` → tone, `*-xs|sm` →
 *    size="sm" (choice controls). Base classes and `w-full` (the default) are removed.
 *
 * Skips (and reports) dynamic class bindings ([class], [ngClass], interpolated class), radios and
 * other inputs inside fieldsets (color/file/range), fieldsets whose content isn't one label + one
 * control, and error blocks that do anything besides printing the field's messages. Finally adds the
 * used primitives to the TypeScript imports and to `@Component({ imports: [...] })`.
 */
import { readFileSync, writeFileSync } from 'fs';

type Primitive = 'UiField' | 'UiChoice' | 'UiInput' | 'UiSelect' | 'UiCheckbox' | 'UiToggle' | 'UiRadio';

interface Report {
  converted: Record<'fieldset' | 'choice' | 'control', number>;
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

/** Index just past the `</tag>` closing the element whose start tag ends at `openEnd` (handles nesting). */
function elementEnd(src: string, tag: string, openEnd: number): number {
  const re = new RegExp(`<${tag}(?=[\\s>/])|</${tag}\\s*>`, 'g');
  re.lastIndex = openEnd + 1;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[0].startsWith('</')) {
      if (--depth === 0) return m.index + m[0].length;
    } else {
      const end = startTagEnd(src, m.index);
      if (end < 0) return -1;
      if (src[end - 1] !== '/') depth++;
      re.lastIndex = end + 1;
    }
  }
  return -1;
}

/** Index just past the `}` matching the `{` at `open`. */
function blockEnd(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

const lineOf = (src: string, index: number) => src.slice(0, index).split('\n').length;
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 140);

// ── Control rewriting ────────────────────────────────────────────────────────────────────────────

type ControlKind = 'input' | 'select' | 'textarea' | 'checkbox' | 'toggle' | 'radio';

const BASE_CLASSES = new Set([
  'input',
  'input-bordered',
  'input-primary',
  'select',
  'select-bordered',
  'select-primary',
  'textarea',
  'textarea-bordered',
  'textarea-primary',
  'w-full',
]);

/** Kind of control a start tag is, from its tag name, type and classes; null when it isn't one. */
function controlKind(tagName: string, startTag: string, classes: string[]): ControlKind | null {
  const has = (t: string) => classes.includes(t);
  if (tagName === 'select') return has('select') ? 'select' : null;
  if (tagName === 'textarea') return has('textarea') ? 'textarea' : null;
  const type = /\stype="([^"]+)"/.exec(startTag)?.[1] ?? 'text';
  if (type === 'checkbox') return has('toggle') ? 'toggle' : has('checkbox') ? 'checkbox' : null;
  if (type === 'radio') return has('radio') ? 'radio' : null;
  if (['color', 'file', 'range', 'hidden'].includes(type)) return null;
  return has('input') ? 'input' : null;
}

const PRIMITIVE: Record<ControlKind, { attr: string; cls: Primitive }> = {
  input: { attr: 'uiInput', cls: 'UiInput' },
  textarea: { attr: 'uiInput', cls: 'UiInput' },
  select: { attr: 'uiSelect', cls: 'UiSelect' },
  checkbox: { attr: 'uiCheckbox', cls: 'UiCheckbox' },
  toggle: { attr: 'uiToggle', cls: 'UiToggle' },
  radio: { attr: 'uiRadio', cls: 'UiRadio' },
};

/**
 * Rewrites one control start tag. `inField`: the control sits in a ui-field/ui-choice bound to its
 * own [formField], so hand-written ng-invalid/ng-dirty class bindings become redundant.
 */
function rewriteControl(
  startTag: string,
  tagName: string,
  inField: boolean,
): { tag: string; kind: ControlKind } | { skip: string } {
  // `\s+` so that removing a class attribute that sat on its own line removes the whole line.
  const done = /\s(uiInput|uiSelect|uiCheckbox|uiToggle|uiRadio)\b/.exec(startTag)?.[1];
  if (done) {
    const kind: ControlKind =
      done === 'uiSelect'
        ? 'select'
        : done === 'uiCheckbox'
          ? 'checkbox'
          : done === 'uiToggle'
            ? 'toggle'
            : done === 'uiRadio'
              ? 'radio'
              : tagName === 'textarea'
                ? 'textarea'
                : 'input';
    const tag = inField ? startTag.replace(/\s+\[class\.ng-(invalid|dirty|touched)\]="[^"]*"/g, '') : startTag;
    return { tag, kind };
  }
  const classMatch = /(\s+)class="([^"]*)"/.exec(startTag);
  if (!classMatch) return { skip: 'no class' };
  if (classMatch[2].includes('{{') || /\[ngClass\]|\[class\]=/.test(startTag)) return { skip: 'dynamic class binding' };
  const classes = classMatch[2].trim().split(/\s+/);
  const kind = controlKind(tagName, startTag, classes);
  if (!kind) return { skip: 'not a recognised control' };
  if (/\[class\.(input|select|textarea|checkbox|toggle|radio)-/.test(startTag))
    return { skip: 'dynamic class binding' };

  const attrs = [PRIMITIVE[kind].attr];
  let rest: string[];
  if (kind === 'checkbox' || kind === 'toggle' || kind === 'radio') {
    const own = classes.filter((c) => c === kind || c.startsWith(`${kind}-`));
    rest = classes.filter((c) => !own.includes(c) && c !== 'w-full');
    const has = (s: string) => own.includes(`${kind}-${s}`);
    const tone = has('primary')
      ? null
      : has('success')
        ? 'success'
        : has('warning')
          ? 'warning'
          : has('error')
            ? 'danger'
            : 'neutral';
    if (tone) attrs.push(`tone="${tone}"`);
    if (has('xs') || has('sm')) attrs.push('size="sm"');
    const known = ['primary', 'success', 'warning', 'error', 'xs', 'sm', 'md'].map((s) => `${kind}-${s}`);
    const leftover = own.find((c) => c !== kind && !known.includes(c));
    if (leftover) return { skip: `unmapped ${leftover}` };
  } else {
    rest = classes.filter((c) => !BASE_CLASSES.has(c));
  }

  let tag = startTag.replace(classMatch[0], rest.length ? `${classMatch[1]}class="${rest.join(' ')}"` : '');
  if (inField) tag = tag.replace(/\s+\[class\.ng-(invalid|dirty|touched)\]="[^"]*"/g, '');
  tag = tag.replace(new RegExp(`^<${tagName}`), `<${tagName} ${attrs.join(' ')}`);
  return { tag, kind };
}

// ── Pass 1: fieldset blocks ──────────────────────────────────────────────────────────────────────

/** Label content → { text, optional } when it is plain text plus optional wrapper/"(opcional)" spans. */
function parseLabel(inner: string): { text: string; optional: boolean } | null {
  let optional = false;
  let html = inner.replace(/<span[^>]*>\s*\(opcional\)\s*<\/span>/gi, () => {
    optional = true;
    return '';
  });
  html = html.replace(/<span class="label-text[^"]*">([\s\S]*?)<\/span>/g, '$1');
  if (/[<>"]/.test(html)) return null;
  const text = html.replace(/\s+/g, ' ').trim();
  return text ? { text, optional } : null;
}

/** True when an `@if` error block only prints the given field's validator messages. */
function isOwnErrorBlock(block: string, field: string): boolean {
  const f = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const head = /^@if\s*\(([^{]*)\)\s*\{/.exec(block);
  if (!head) return false;
  // condition only reads the field's own state
  const cond = head[1]
    .replace(new RegExp(`${f}\\(\\)\\.(touched|invalid|dirty|errors)\\(\\)(\\.length)?`, 'g'), '')
    .replace(/[\s&|!()]/g, '');
  if (cond) return false;
  // Interpolations become brace-free placeholders first, so the @for body can be matched up to its `}`.
  const body = block
    .slice(head[0].length, -1)
    .replace(/\{\{\s*(\w+)\.message\s*\}\}/g, '§LOOP:$1§')
    .replace(new RegExp(`\\{\\{\\s*${f}\\(\\)\\.errors\\(\\)\\[0\\]\\.message\\s*\\}\\}`, 'g'), '§MSG§')
    .replace(
      new RegExp(`@for\\s*\\(\\s*(\\w+) of ${f}\\(\\)\\.errors\\(\\);[^)]*\\)\\s*\\{([^{}]*)\\}`, 'g'),
      (_, v, inner) => inner.replaceAll(`§LOOP:${v}§`, '§MSG§'),
    );
  const messages = /^\s*(<p class="[^"]*text-error[^"]*">\s*§MSG§\s*<\/p>\s*)+$/;
  const list = /^\s*<ul>\s*<li class="[^"]*text-error[^"]*">\s*§MSG§\s*<\/li>\s*<\/ul>\s*$/;
  return messages.test(body) || list.test(body);
}

function convertFieldsets(src: string, report: Report): string {
  let out = '';
  let i = 0;
  const re = /<div(\s[^>]*?)?\sclass="fieldset(\s[^"]*)?"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const openEnd = startTagEnd(src, start);
    const end = openEnd < 0 ? -1 : elementEnd(src, 'div', openEnd);
    if (end < 0) break;
    re.lastIndex = end;
    const line = lineOf(src, start);
    const skip = (reason: string) =>
      report.skipped.push({ line, reason: `fieldset: ${reason}`, snippet: oneLine(src.slice(start, end)) });

    const openTag = src.slice(start, openEnd + 1);
    let inner = src.slice(openEnd + 1, end - '</div>'.length);

    // label
    const label = /^\s*<label(\s[^>]*)?>([\s\S]*?)<\/label>/.exec(inner);
    if (!label) {
      skip('no leading <label>');
      continue;
    }
    if (label[1] && label[1].replace(/\s(\[for\]|for|class)="[^"]*"/g, '').trim()) {
      skip('label has extra attributes');
      continue;
    }
    const parsed = parseLabel(label[2]);
    if (!parsed) {
      skip('label has markup');
      continue;
    }
    inner = inner.slice(label[0].length);

    // control
    const ctl = /^\s*<(input|select|textarea)(?=[\s>/])/.exec(inner);
    if (!ctl) {
      skip('no control after the label');
      continue;
    }
    const tagName = ctl[1];
    const ctlStart = ctl.index + ctl[0].indexOf('<');
    const ctlOpenEnd = startTagEnd(inner, ctlStart);
    const ctlEnd = tagName === 'input' ? ctlOpenEnd + 1 : elementEnd(inner, tagName, ctlOpenEnd);
    if (ctlOpenEnd < 0 || ctlEnd < 0) {
      skip('unparsable control');
      continue;
    }
    const startTag = inner.slice(ctlStart, ctlOpenEnd + 1);
    const field = /\[formField\]="([^"]+)"/.exec(startTag)?.[1];
    const rewritten = rewriteControl(startTag, tagName, !!field);
    if ('skip' in rewritten) {
      skip(rewritten.skip);
      continue;
    }
    if (rewritten.kind === 'radio') {
      skip('radio in a fieldset (group it by hand)');
      continue;
    }
    const control = rewritten.tag + inner.slice(ctlOpenEnd + 1, ctlEnd);

    // after the control: the field's own error block and/or one static helper paragraph (→ hint)
    let rest = inner.slice(ctlEnd).trim();
    let hint: string | null = null;
    let restOk = true;
    while (rest && restOk) {
      if (rest.startsWith('@if')) {
        const close = blockEnd(rest, rest.indexOf('{'));
        restOk = close > 0 && !!field && isOwnErrorBlock(rest.slice(0, close), field);
        rest = rest.slice(Math.max(close, 0)).trim();
      } else {
        const p = /^<p class="([^"]*)">([^<{}"]+)<\/p>/.exec(rest);
        restOk = !!p && !hint && !p[1].includes('text-error');
        if (p) hint = p[2].replace(/\s+/g, ' ').trim();
        rest = rest.slice(p?.[0].length ?? 0).trim();
      }
    }
    if (!restOk) {
      skip('extra content after the control');
      continue;
    }

    // assemble
    const choice = rewritten.kind === 'checkbox' || rewritten.kind === 'toggle';
    const wrapper = choice ? 'ui-choice' : 'ui-field';
    const extraClass = (m[2] ?? '').trim();
    const otherAttrs = openTag
      .slice(4, -1)
      .replace(/\sclass="[^"]*"/, '')
      .trim();
    const attrs = [`label="${parsed.text}"`];
    if (field) attrs.push(`[field]="${field}"`);
    if (hint) attrs.push(`hint="${hint}"`);
    if (parsed.optional && !choice) attrs.push('optional');
    if (extraClass) attrs.push(`class="${extraClass}"`);
    if (otherAttrs) attrs.push(otherAttrs);
    const indent = /([ \t]*)$/.exec(src.slice(0, start))?.[1] ?? '';
    const controlLines = control.trim().split('\n');
    const reindented = controlLines.map((l, n) => (n === 0 ? `${indent}  ${l.trim()}` : l)).join('\n');

    out += src.slice(i, start) + `<${wrapper} ${attrs.join(' ')}>\n${reindented}\n${indent}</${wrapper}>`;
    i = end;
    report.converted.fieldset++;
    report.used.add(choice ? 'UiChoice' : 'UiField');
    report.used.add(PRIMITIVE[rewritten.kind].cls);
  }
  return out + src.slice(i);
}

// ── Pass 2: label.cursor-pointer wrapping a checkbox/toggle + text ───────────────────────────────

function convertChoiceLabels(src: string, report: Report): string {
  let out = '';
  let i = 0;
  const re = /<label\s+class="([^"]*\bcursor-pointer\b[^"]*)"\s*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const openEnd = start + m[0].length - 1;
    const end = elementEnd(src, 'label', openEnd);
    if (end < 0) break;
    re.lastIndex = end;
    const inner = src.slice(openEnd + 1, end - '</label>'.length);
    if (!/<input[^>]*type="checkbox"/.test(inner)) continue; // not a choice label
    const line = lineOf(src, start);
    const skip = (reason: string) =>
      report.skipped.push({ line, reason: `choice label: ${reason}`, snippet: oneLine(src.slice(start, end)) });

    const inputStart = inner.indexOf('<input');
    const inputEnd = startTagEnd(inner, inputStart) + 1;
    const span = /<span(?:\s+class="[^"]*")?>([^<]+)<\/span>/.exec(inner);
    const leftover = (inner.slice(0, inputStart) + inner.slice(inputEnd)).replace(span?.[0] ?? '', '').trim();
    if (!span || leftover) {
      skip('content besides one control and one text span');
      continue;
    }
    const rewritten = rewriteControl(inner.slice(inputStart, inputEnd), 'input', false);
    if ('skip' in rewritten) {
      skip(rewritten.skip);
      continue;
    }

    const layout = m[1]
      .split(/\s+/)
      .filter(
        (c) => !['label', 'cursor-pointer', 'flex', 'items-center', 'justify-start'].includes(c) && !/^gap-/.test(c),
      );
    const attrs = [`label="${span[1].replace(/\s+/g, ' ').trim()}"`];
    if (layout.length) attrs.push(`class="${layout.join(' ')}"`);
    const indent = /([ \t]*)$/.exec(src.slice(0, start))?.[1] ?? '';
    const control = rewritten.tag.replace(/\n\s*/g, `\n${indent}    `);
    out += src.slice(i, start) + `<ui-choice ${attrs.join(' ')}>\n${indent}  ${control}\n${indent}</ui-choice>`;
    i = end;
    report.converted.choice++;
    report.used.add('UiChoice');
    report.used.add(PRIMITIVE[rewritten.kind].cls);
  }
  return out + src.slice(i);
}

// ── Pass 3: remaining standalone controls ────────────────────────────────────────────────────────

function convertControls(src: string, report: Report): string {
  let out = '';
  let i = 0;
  const re = /<(input|select|textarea)(?=[\s>/])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const end = startTagEnd(src, start);
    if (end < 0) break;
    re.lastIndex = end + 1;
    const startTag = src.slice(start, end + 1);
    if (/\bui(Input|Select|Checkbox|Toggle|Radio)\b/.test(startTag)) continue;
    const cls = /\sclass="([^"]*)"/.exec(startTag)?.[1];
    if (!cls || !/(^|\s)(input|select|textarea|checkbox|toggle|radio)(\s|$|-)/.test(cls)) continue;
    const rewritten = rewriteControl(startTag, m[1], false);
    if ('skip' in rewritten) {
      if (rewritten.skip !== 'not a recognised control')
        report.skipped.push({
          line: lineOf(src, start),
          reason: `control: ${rewritten.skip}`,
          snippet: oneLine(startTag),
        });
      continue;
    }
    out += src.slice(i, start) + rewritten.tag;
    i = end + 1;
    report.converted.control++;
    report.used.add(PRIMITIVE[rewritten.kind].cls);
  }
  return out + src.slice(i);
}

// ── Imports ──────────────────────────────────────────────────────────────────────────────────────

function addImports(src: string, file: string, names: Primitive[]): string {
  const inUiLib = file.includes('libs/ui/src/');
  const from = inUiLib ? './field' : '#/ui';
  const missingTs = names.filter(
    (n) => !new RegExp(`import \\{[^}]*\\b${n}\\b[^}]*\\} from '(#/ui|\\./field)'`).test(src),
  );
  if (missingTs.length) {
    const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace('/', '\\/')}';`).exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...missingTs,
      ];
      all.sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '${from}';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { ${[...missingTs].sort().join(', ')} } from '${from}';\n` + src.slice(pos);
    }
  }
  const comp = /@Component\(\{([\s\S]*?)\n\s*(template|templateUrl)\s*:/.exec(src);
  if (comp) {
    const head = comp[1];
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(head);
    if (arr) {
      const missing = names.filter((n) => !new RegExp(`\\b${n}\\b`).test(arr[1]));
      if (missing.length) {
        const current = arr[1].trim().replace(/,\s*$/, '');
        src = src.replace(head, head.replace(arr[0], `imports: [${[...missing, current].filter(Boolean).join(', ')}]`));
      }
    } else {
      const sel = /(\n(\s*)selector:[^\n]*)/.exec(head);
      if (sel) src = src.replace(head, head.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [${names.join(', ')}],`));
    }
  }
  return src;
}

/** Primitives whose markup appears in a component template but that the component doesn't import. */
function unregistered(src: string): string[] {
  const markers: [RegExp, Primitive][] = [
    [/<ui-field\b/, 'UiField'],
    [/<ui-choice\b/, 'UiChoice'],
    [/\buiInput\b/, 'UiInput'],
    [/\buiSelect\b/, 'UiSelect'],
    [/\buiCheckbox\b/, 'UiCheckbox'],
    [/\buiToggle\b/, 'UiToggle'],
    [/\buiRadio\b/, 'UiRadio'],
  ];
  const missing: string[] = [];
  for (const m of src.matchAll(/@Component\(\{([\s\S]*?)\n\}\)/g)) {
    const block = m[1];
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(block)?.[1] ?? '';
    for (const [marker, name] of markers)
      if (marker.test(block) && !new RegExp(`\\b${name}\\b`).test(arr)) missing.push(name);
  }
  return missing;
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const totals = { fieldset: 0, choice: 0, control: 0, skipped: 0 };
const notRegistered: string[] = [];
for (const file of files) {
  if (/components\/field(\.spec)?\.ts$|\.stories\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { converted: { fieldset: 0, choice: 0, control: 0 }, skipped: [], used: new Set() };
  let out = convertFieldsets(src, report);
  out = convertChoiceLabels(out, report);
  out = convertControls(out, report);
  if (report.used.size) out = addImports(out, file, [...report.used].sort() as Primitive[]);
  const missing = unregistered(out);
  if (missing.length) notRegistered.push(`${file}: ${missing.join(', ')}`);
  if (!dry && out !== src) writeFileSync(file, out);

  const c = report.converted;
  totals.fieldset += c.fieldset;
  totals.choice += c.choice;
  totals.control += c.control;
  totals.skipped += report.skipped.length;
  if (c.fieldset + c.choice + c.control + report.skipped.length === 0) continue;
  console.log(
    `${file}: ${c.fieldset} fieldsets, ${c.choice} choice labels, ${c.control} controls; ${report.skipped.length} left for review`,
  );
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(
  `\ntotal: ${totals.fieldset} fieldsets, ${totals.choice} choice labels, ${totals.control} controls converted; ` +
    `${totals.skipped} left for review${dry ? ' (dry run)' : ''}`,
);
if (notRegistered.length) {
  console.error(`\nPrimitives used but not in @Component imports (they would render unstyled):`);
  for (const f of notRegistered) console.error(`  ${f}`);
  process.exitCode = 1;
}
