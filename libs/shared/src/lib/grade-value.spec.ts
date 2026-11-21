import { NOT_A_NUMBER, ONE_DECIMAL, parseCell, scoreError } from './grade-value';

const scale = { minimum: 1, maximum: 5 };

describe('grade values (ASM-001 BR .2)', () => {
  it.each([
    ['', null],
    [' 4 ', 4],
    ['4.5', 4.5],
    ['4,5', 4.5],
    ['1', 1],
    ['5.0', 5],
  ])('accepts %j', (text, score) => {
    expect(parseCell(text, scale)).toEqual({ score, error: null });
  });

  it.each([
    ['7', 'Entre 1 y 5'],
    ['0.9', 'Entre 1 y 5'],
    ['4.25', ONE_DECIMAL],
    ['abc', NOT_A_NUMBER],
    ['4,5,1', NOT_A_NUMBER],
    ['EX', NOT_A_NUMBER],
  ])('refuses %j: %s', (text, error) => {
    expect(parseCell(text, scale)).toEqual({ score: null, error });
  });

  it('checks scores the API receives', () => {
    expect(scoreError(3.3, scale)).toBeNull();
    expect(scoreError(4.05, scale)).toBe(ONE_DECIMAL);
    expect(scoreError(Number.NaN, scale)).toBe(NOT_A_NUMBER);
  });
});
