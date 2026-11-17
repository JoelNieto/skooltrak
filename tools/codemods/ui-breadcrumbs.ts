/**
 * Codemod: hand-written DaisyUI breadcrumbs → `ui-breadcrumbs` / `lib-page-header [breadcrumbs]`.
 *
 *   bun tools/codemods/ui-breadcrumbs.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-breadcrumbs.ts --dry <file.ts> [...more]  # report only
 *
 *   <div class="breadcrumbs text-sm">
 *     <ul>
 *       <li><a routerLink="/">Inicio</a></li>
 *       <li><a [routerLink]="['/courses', course.id]">{{ course.name }}</a></li>
 *       <li>Notas</li>
 *     </ul>
 *   </div>
 * →
 *   <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: course.name, link: ['/courses', course.id] }, { label: 'Notas' }]" />
 *
 * When the next element is a `<lib-page-header>`, the trail moves into its `[breadcrumbs]` input
 * instead. Items may be static links, `[routerLink]` links, text, or text with interpolations
 * (`Curso {{ name }}` → `'Curso ' + (name)`). Blocks with control flow, other markup or double
 * quotes inside expressions are reported for review. Registers `Breadcrumbs` in the imports of every
 * @Component that now uses `<ui-breadcrumbs>`.
 */
import { readFileSync, writeFileSync } from 'fs';

interface Report {
  standalone: number;
  merged: number;
  skipped: { line: number; reason: string; snippet: string }[];
}

/** `Curso {{ name }} (copia)` → `'Curso ' + (name) + ' (copia)'`; null when it can't be expressed safely. */
function labelExpr(text: string): string | null {
  const parts: string[] = [];
  const re = /\{\{([\s\S]*?)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const literal = (s: string) => {
    if (!s) return;
    if (s.includes('"')) throw new Error('quote');
    parts.push(`'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
  };
  try {
    const collapsed = text.replace(/\s+/g, ' ').trim();
    while ((m = re.exec(collapsed))) {
      literal(collapsed.slice(last, m.index));
      const expr = m[1].trim();
      if (expr.includes('"') || expr.includes('|')) return null; // pipes need parentheses context; review by hand
      parts.push(parts.length || m.index + m[0].length < collapsed.length ? `(${expr})` : expr);
      last = m.index + m[0].length;
    }
    literal(collapsed.slice(last));
  } catch {
    return null;
  }
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0].replace(/^\((.*)\)$/, '$1') : parts.join(' + ');
}

/** One `<li>` → `{ label: …, link: … }` source, or null. */
function item(li: string): string | null {
  const html = li.trim();
  const staticLink = /^<a\s+routerLink="([^"]+)"\s*>([^<]+)<\/a>$/.exec(html);
  const boundLink = /^<a\s+\[routerLink\]="([^"]+)"\s*>([^<]+)<\/a>$/.exec(html);
  if (staticLink || boundLink) {
    const label = labelExpr((staticLink ?? boundLink)![2]);
    if (!label) return null;
    const link = staticLink ? `'${staticLink[1]}'` : boundLink![1];
    return `{ label: ${label}, link: ${link} }`;
  }
  if (html.includes('<')) return null;
  const label = labelExpr(html);
  return label ? `{ label: ${label} }` : null;
}

function convert(src: string, report: Report): string {
  let out = '';
  let i = 0;
  const re = /<div class="(breadcrumbs(?:\s[^"]*)?)">\s*<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const end = start + m[0].length;
    const line = src.slice(0, start).split('\n').length;
    const skip = (reason: string) =>
      report.skipped.push({ line, reason, snippet: m![0].replace(/\s+/g, ' ').slice(0, 140) });
    if (/@(if|for|switch)\b/.test(m[2])) {
      skip('control flow inside');
      continue;
    }
    const lis = [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
    const leftover = m[2].replace(/<li>[\s\S]*?<\/li>/g, '').trim();
    if (!lis.length || leftover) {
      skip('unexpected markup');
      continue;
    }
    const items = lis.map(item);
    if (items.some((x) => x === null)) {
      skip('item with markup, pipes or quotes');
      continue;
    }
    const array = `[${items.join(', ')}]`;

    const extra = m[1].split(/\s+/).filter((c) => c !== 'breadcrumbs' && c !== 'text-sm');
    const next = /^\s*(<!--[\s\S]*?-->\s*)*<lib-page-header\b/.exec(src.slice(end));
    if (next && !extra.length) {
      // move into the page header: drop the block (and the whitespace after it), add the input
      const headerStart = end + next[0].length - '<lib-page-header'.length;
      const comments = src.slice(end, headerStart).trim();
      out += src.slice(i, start) + (comments ? `${comments}\n${/([ \t]*)$/.exec(src.slice(0, start))![1]}` : '');
      out += `<lib-page-header [breadcrumbs]="${array}"`;
      i = headerStart + '<lib-page-header'.length;
      report.merged++;
    } else {
      const cls = extra.length ? ` class="${extra.join(' ')}"` : '';
      out += src.slice(i, start) + `<ui-breadcrumbs${cls} [items]="${array}" />`;
      i = end;
      report.standalone++;
    }
  }
  return out + src.slice(i);
}

function registerBreadcrumbs(src: string): string {
  if (!/import \{[^}]*\bBreadcrumbs\b[^}]*\} from '#\/ui'/.test(src)) {
    const existing = /import \{([^}]*)\} from '#\/ui';/.exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        'Breadcrumbs',
      ].sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '#/ui';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { Breadcrumbs } from '#/ui';\n` + src.slice(pos);
    }
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    if (!body.includes('<ui-breadcrumbs')) return block;
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      if (/\bBreadcrumbs\b/.test(arr[1])) return block;
      return block.replace(arr[0], `imports: [Breadcrumbs, ${arr[1].trim().replace(/,\s*$/, '')}]`);
    }
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [Breadcrumbs],`) : block;
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const totals = { standalone: 0, merged: 0, skipped: 0 };
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const report: Report = { standalone: 0, merged: 0, skipped: [] };
  let out = convert(src, report);
  if (report.standalone) out = registerBreadcrumbs(out);
  if (!dry && out !== src) writeFileSync(file, out);
  totals.standalone += report.standalone;
  totals.merged += report.merged;
  totals.skipped += report.skipped.length;
  if (report.standalone + report.merged + report.skipped.length === 0) continue;
  console.log(
    `${file}: ${report.merged} into page header, ${report.standalone} standalone; ${report.skipped.length} left for review`,
  );
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(
  `\ntotal: ${totals.merged} moved into lib-page-header, ${totals.standalone} → ui-breadcrumbs; ${totals.skipped} left for review${dry ? ' (dry run)' : ''}`,
);
