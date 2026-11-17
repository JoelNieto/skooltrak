import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { findGradients, propertyAt, rule, RULE_NAME } from './flat-styles';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
  },
} as RuleTesterConfig);

const component = (styles: string) => `
  import { Component } from '@angular/core';
  @Component({ selector: 'app-x', template: '', styles: ${styles} })
  export class X {}
`;

ruleTester.run(RULE_NAME, rule, {
  valid: [
    component('`.card { background: var(--ui-surface-1); border: 1px solid var(--ui-line); }`'),
    // a fade that only clips scrolling content
    component('`.log { mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); }`'),
    component("'.x { -webkit-mask: radial-gradient(#000, transparent); }'"),
    // gradients outside a component's styles are not this rule's business
    `const bg = 'linear-gradient(red, blue)';`,
    `@Component({ selector: 'app-y', template: '<div style="x"></div>' }) class Y {}`,
  ],
  invalid: [
    {
      code: component('`.glow { background: linear-gradient(90deg, transparent, var(--ui-action)); }`'),
      errors: [{ messageId: 'gradient' }],
    },
    {
      code: component(
        "['.a { background-image: radial-gradient(#000 1px, transparent 1px); }', '.b { background: conic-gradient(red, blue); }']",
      ),
      errors: [{ messageId: 'gradient' }, { messageId: 'gradient' }],
    },
    {
      code: component('`.s { background: repeating-linear-gradient(to bottom, red 0 1px, transparent 1px 8px); }`'),
      errors: [{ messageId: 'gradient' }],
    },
    {
      // a mask in one rule doesn't excuse a fill in the next
      code: component(
        '`.a { mask-image: linear-gradient(#000, transparent); } .b { background: linear-gradient(red, blue); }`',
      ),
      errors: [{ messageId: 'gradient', line: 3 }],
    },
  ],
});

describe('helpers', () => {
  it('reads the property a value belongs to', () => {
    const css = '.a { color: red; mask-image: linear-gradient(#000, transparent); }';
    expect(propertyAt(css, css.indexOf('linear'))).toBe('mask-image');
    expect(propertyAt('.b{background:linear-gradient(red,blue)}', 14)).toBe('background');
  });

  it('skips masks and finds fills', () => {
    expect(findGradients('.a{mask:linear-gradient(#000,transparent)}')).toEqual([]);
    expect(findGradients('.a{background:linear-gradient(red,blue)}')).toHaveLength(1);
  });
});
