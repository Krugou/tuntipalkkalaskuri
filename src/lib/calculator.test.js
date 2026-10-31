import { describe, expect, it } from 'vitest';
import { WEEKS_PER_MONTH, calculateHourlyWage, formatEuro } from './calculator.js';

describe('calculateHourlyWage', () => {
  it('converts weekly hours to monthly hours', () => {
    const r = calculateHourlyWage(2000, 40, 'weekly');
    expect(r.monthlyHours).toBeCloseTo(40 * WEEKS_PER_MONTH);
    expect(r.hourly).toBeCloseTo(2000 / (40 * WEEKS_PER_MONTH));
  });

  it('uses monthly hours as given', () => {
    const r = calculateHourlyWage(2000, 160, 'monthly');
    expect(r.monthlyHours).toBe(160);
    expect(r.hourly).toBe(12.5);
  });

  it('handles the 37.5 h week default', () => {
    const r = calculateHourlyWage(2000, 37.5, 'weekly');
    expect(r.hourly).toBeCloseTo(12.31, 2);
  });

  it('computes weekly and yearly pay', () => {
    const r = calculateHourlyWage(3000, 40, 'weekly');
    expect(r.weeklyPay).toBeCloseTo(3000 / WEEKS_PER_MONTH);
    expect(r.yearlyPay).toBe(36000);
  });

  it.each([
    [0, 40],
    [-100, 40],
    [NaN, 40],
    [Infinity, 40],
    [2000, 0],
    [2000, -5],
    [2000, NaN],
    [2000, Infinity],
  ])('returns null for invalid input (%s, %s)', (salary, hours) => {
    expect(calculateHourlyWage(salary, hours, 'weekly')).toBeNull();
    expect(calculateHourlyWage(salary, hours, 'monthly')).toBeNull();
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
});
