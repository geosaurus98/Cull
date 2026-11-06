import { describe, expect, it } from 'vitest';
import { parsePrice } from './parse';

describe('parsePrice', () => {
  it.each([
    ['', undefined],
    ['  ', undefined],
    ['12', 12],
    ['12.50', 12.5],
    ['1,200', 1200],
    ['12,50', 12.5],
    ['$ 30', 30],
    ['abc', 'invalid'],
    ['-5', 'invalid'],
  ])('%j -> %j', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });
});
