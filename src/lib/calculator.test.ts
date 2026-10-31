import { describe, expect, it } from 'vitest';
import {
  WEEKS_PER_MONTH,
  calculateHourlyWage,
  estimateNetPay,
  formatEuro,
  formatNumber,
  parsePositiveNumber,
  parseTaxRate,
} from './calculator';

describe('calculateHourlyWage', () => {
  it('converts weekly hours to monthly hours', () => {
    const r = calculateHourlyWage(2000, 40, 'weekly');
    if (!r) throw new Error('Expected a valid hourly wage result.');
    expect(r.monthlyHours).toBeCloseTo(40 * WEEKS_PER_MONTH);
    expect(r.hourly).toBeCloseTo(2000 / (40 * WEEKS_PER_MONTH));
  });

  it('uses monthly hours as given', () => {
    const r = calculateHourlyWage(2000, 160, 'monthly');
    if (!r) throw new Error('Expected a valid hourly wage result.');
    expect(r.monthlyHours).toBe(160);
    expect(r.hourly).toBe(12.5);
  });

  it('handles the 37.5 h week default', () => {
    const r = calculateHourlyWage(2000, 37.5, 'weekly');
    if (!r) throw new Error('Expected a valid hourly wage result.');
    expect(r.hourly).toBeCloseTo(12.31, 2);
  });

  it('computes weekly and yearly pay', () => {
    const r = calculateHourlyWage(3000, 40, 'weekly');
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.weeklyPay).toBeCloseTo(3000 / WEEKS_PER_MONTH);
    expect(r.yearlyPay).toBe(36000);
  });

  const invalidInputs: [number, number][] = [
    [0, 40],
    [-100, 40],
    [NaN, 40],
    [Infinity, 40],
    [2000, 0],
    [2000, -5],
    [2000, NaN],
    [2000, Infinity],
  ];

  it.each(invalidInputs)(
    'returns null for invalid input (%s, %s)',
    (salary, hours) => {
      expect(calculateHourlyWage(salary, hours, 'weekly')).toBeNull();
      expect(calculateHourlyWage(salary, hours, 'monthly')).toBeNull();
    },
  );

  it('rejects overflowing monthly hours', () => {
    expect(calculateHourlyWage(2000, Number.MAX_VALUE, 'weekly')).toBeNull();
  });
});

describe('parsePositiveNumber', () => {
  it.each([
    ['2000', 2000],
    ['37,5', 37.5],
    ['.5', 0.5],
    [',5', 0.5],
    [' 12.25 ', 12.25],
  ])('parses valid positive input %s', (input, expected) => {
    expect(parsePositiveNumber(input)).toBe(expected);
  });

  it.each(['', '0', '-1', '1,2.3', 'abc', '1e3'])(
    'rejects invalid positive input %s',
    (input) => {
      expect(parsePositiveNumber(input)).toBeNull();
    },
  );
});

describe('parseTaxRate', () => {
  it.each([
    ['0', 0],
    ['25,5', 25.5],
    ['100', 100],
  ])('parses valid tax rate %s', (input, expected) => {
    expect(parseTaxRate(input)).toBe(expected);
  });

  it.each(['', '-1', '100.1', 'abc'])(
    'rejects invalid tax rate %s',
    (input) => {
      expect(parseTaxRate(input)).toBeNull();
    },
  );
});

describe('estimateNetPay', () => {
  it('calculates net values from a flat effective tax rate', () => {
    expect(estimateNetPay(2000, 40, 'weekly', 25)).toEqual({
      monthlyNet: 1500,
      hourlyNet: 1500 / (40 * WEEKS_PER_MONTH),
      yearlyNet: 18000,
    });
  });

  it('allows a zero and one hundred percent estimate', () => {
    expect(estimateNetPay(2000, 160, 'monthly', 0)?.monthlyNet).toBe(2000);
    expect(estimateNetPay(2000, 160, 'monthly', 100)?.monthlyNet).toBe(0);
  });

  it('rejects invalid salary, hours, and tax rates', () => {
    expect(estimateNetPay(0, 40, 'weekly', 25)).toBeNull();
    expect(estimateNetPay(2000, 0, 'weekly', 25)).toBeNull();
    expect(estimateNetPay(2000, 40, 'weekly', 101)).toBeNull();
  });
});

describe('formatEuro', () => {
  it('formats with two decimals and euro sign', () => {
    const s = formatEuro(12.5);
    expect(s).toContain('€');
    expect(s).toContain('12.50');
  });

  it('rounds to two decimals', () => {
    expect(formatEuro(1.005 + 0.001)).toContain('1.01');
  });

  it('adds thousands separators', () => {
    expect(formatEuro(36000)).toContain('36,000.00');
  });

  it('uses Finnish decimal and currency formatting', () => {
    expect(formatEuro(12.5, 'fi')).toContain('12,50');
    expect(formatEuro(12.5, 'fi')).toContain('€');
    expect(formatNumber(162.5, 'fi')).toBe('162,5');
  });
});
