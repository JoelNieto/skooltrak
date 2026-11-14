/**
 * Codemod: DaisyUI alerts → the `uiAlert` primitive from `#/ui`.
 *
 *   bun tools/codemods/ui-alert.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-alert.ts --dry <file.ts> [...more]  # report only
 *
 * `class="alert alert-warning mt-4"` → `uiAlert tone="warning" class="mt-4"`:
 *   alert-info → info (the default, omitted) · alert-success · alert-warning · alert-error → danger;
 *   style classes (soft, outline, dash) are dropped (uiAlert has one style); a static role="alert"
 *   is dropped too (uiAlert sets the role from the tone). Children stay as they are.
 * Reports dynamic class bindings and unmapped classes (alert-vertical/horizontal). Registers Alert in
 * the imports of every @Component that uses `uiAlert`.
 */
import { readFileSync, writeFileSync } from 'fs';

const TONE: Record<string, string | null> = {
  'alert-info': null,
  'alert-success': 'success',
  'alert-warning': 'warning',
  'alert-error': 'danger',
};
const DROPPED = new Set(['alert', 'alert-soft', 'alert-outline', 'alert-dash']);

interface Report {
  converted: number;
  skipped: { line: number; reason: string; snippet: string }[];
}

function convert(src: string, report: Report): string {
  return src.replace(
    /<([a-z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (tag, name: string, attrs: string, offset: number) => {
      const cls = /(\s+)class="([^"]*)"/.exec(attrs);
      if (!cls || !/(^|\s)alert(\s|$)/.test(cls[2]) || /\suiAlert\b/.test(attrs)) return tag;
      const line = src.slice(0, offset).split('\n').length;
      const skip = (reason: string) => {
        report.skipped.push({ line, reason, snippet: tag.replace(/\s+/g, ' ').slice(0, 140) });
        return tag;
      };
      if (/\[ngClass\]|\[class\]=|\[class\.alert/.test(attrs) || cls[2].includes('{{'))
        return skip('dynamic class binding');
      const tokens = cls[2].trim().split(/\s+/);
      const own = tokens.filter((t) => t === 'alert' || t.startsWith('alert-'));
      const unknown = own.find((t) => !DROPPED.has(t) && !(t in TONE));
      if (unknown) return skip(`unmapped ${unknown}`);
      const tone = own.map((t) => TONE[t]).find((t) => t);
      const keep = tokens.filter((t) => !own.includes(t));
      let out = attrs.replace(cls[0], keep.length ? `${cls[1]}class="${keep.join(' ')}"` : '');
      out = out.replace(/\s+role="alert"/, '');
      report.converted++;
      return `<${name} uiAlert${tone ? ` tone="${tone}"` : ''}${out}>`;
    },
  );
}

function registerAlert(src: string, file: string): string {
  const from = file.includes('libs/ui/src/') ? './alert' : '#/ui';
  if (!new RegExp(`import \\{[^}]*\\bAlert\\b[^}]*\\} from '${from}'`).test(src)) {
    const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace(/[./]/g, '\\$&')}';`).exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        'Alert',
      ].sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '${from}';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { Alert } from '${from}';\n` + src.slice(pos);
    }
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    if (!/\suiAlert\b/.test(body)) return block;
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      if (/\bAlert\b/.test(arr[1])) return block;
      return block.replace(arr[0], `imports: [Alert, ${arr[1].trim().replace(/,\s*$/, '')}]`);
    }
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [Alert],`) : block;
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
let total = 0;
let skipped = 0;
for (const file of files) {
  if (/components\/alert(\.spec)?\.ts$|\.stories\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { converted: 0, skipped: [] };
  let out = convert(src, report);
  if (report.converted) out = registerAlert(out, file);
  if (!dry && out !== src) writeFileSync(file, out);
  total += report.converted;
  skipped += report.skipped.length;
  if (report.converted + report.skipped.length === 0) continue;
  console.log(`${file}: ${report.converted} alerts; ${report.skipped.length} left for review`);
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(`\ntotal: ${total} alerts converted; ${skipped} left for review${dry ? ' (dry run)' : ''}`);
