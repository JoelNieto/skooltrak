import { BadRequestException } from '@nestjs/common';
import { normalizeVariants, withStock } from './store-stock';

describe('withStock', () => {
  it('sums the stock of every variant', () => {
    const p = withStock({ variants: [{ stock: 3 }, { stock: 4 }] });
    expect(p.totalStock).toBe(7);
    expect(p.hasOutOfStockVariant).toBe(false);
  });

  it('flags a sold-out size while others still have stock', () => {
    expect(withStock({ variants: [{ stock: 0 }, { stock: 2 }] }).hasOutOfStockVariant).toBe(true);
  });

  it('does not flag a partly sold-out product when everything is sold out', () => {
    const p = withStock({ variants: [{ stock: 0 }, { stock: 0 }] });
    expect(p.totalStock).toBe(0);
    expect(p.hasOutOfStockVariant).toBe(false);
  });
});

describe('normalizeVariants', () => {
  it('trims labels and numbers the sort order by position', () => {
    expect(normalizeVariants([{ label: ' S ', stock: 1 }, { label: 'M', stock: 2, sortOrder: 7 }])).toEqual([
      { label: 'S', stock: 1, sortOrder: 0 },
      { label: 'M', stock: 2, sortOrder: 7 },
    ]);
  });

  it('refuses an empty list or a blank label', () => {
    expect(() => normalizeVariants([])).toThrow(BadRequestException);
    expect(() => normalizeVariants([{ label: '  ', stock: 1 }])).toThrow(BadRequestException);
  });

  it('refuses the same label twice, ignoring case', () => {
    expect(() => normalizeVariants([{ label: 'M', stock: 1 }, { label: 'm ', stock: 1 }])).toThrow(
      'La talla "m" está repetida.',
    );
  });
});
