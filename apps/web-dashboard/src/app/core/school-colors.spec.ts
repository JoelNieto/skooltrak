import { contrastRatio, darkVariant, getContentColor, isValidHex, schoolInitials } from './school-colors';

describe('school colours', () => {
  it('accepts 3 and 6 digit hex only', () => {
    expect(isValidHex('#abc')).toBe(true);
    expect(isValidHex('#8a1c2b')).toBe(true);
    expect(isValidHex('8a1c2b')).toBe(false);
    expect(isValidHex('#8a1c2')).toBe(false);
    expect(isValidHex(null)).toBe(false);
  });

  it('picks dark text on light colours and light text on dark ones', () => {
    expect(getContentColor('#facc15')).toBe('#1a1a1a');
    expect(getContentColor('#8a1c2b')).toBe('#fafafa');
  });

  it('lightens a dark school colour until it reads on the dark surface', () => {
    const v = darkVariant('#8a1c2b');
    expect(v).not.toBe('#8a1c2b');
    expect(contrastRatio(v, '#131f42')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps a colour that already reads on the dark surface', () => {
    expect(darkVariant('#93c5fd')).toBe('#93c5fd');
  });

  it('builds a two-letter monogram, skipping the school-type word and small words', () => {
    expect(schoolInitials('Escuela Nuevo Horizonte')).toBe('NH');
    expect(schoolInitials('Colegio San Martín de Porres')).toBe('SM');
    expect(schoolInitials('Academia Santa Lucía')).toBe('SL');
    expect(schoolInitials('Las Cumbres')).toBe('C');
    expect(schoolInitials('Lumen')).toBe('L');
    expect(schoolInitials('')).toBe('?');
  });
});
