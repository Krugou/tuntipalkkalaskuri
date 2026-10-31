import { describe, expect, it } from 'vitest';
import {
  WEEKS_PER_MONTH,
  calculateHourlyWage,
  calculateGrossForNetTarget,
  estimateFinnishNetPay2026,
  estimateNetPay,
  FINNISH_EMPLOYEE_CONTRIBUTION_RATE,
  FINNISH_TAX_EXAMPLE_MAX_INCOME,
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

describe('estimateFinnishNetPay2026', () => {
  it('annualizes monthly salary and interpolates official Finnish 2026 examples', () => {
    const estimate = estimateFinnishNetPay2026(2000, 37.5, 'weekly');
    expect(estimate).not.toBeNull();
    if (!estimate) throw new Error('Expected a Finnish tax estimate.');
    expect(estimate.annualGross).toBe(24000);
    expect(estimate.annualTax).toBeCloseTo(1179.296, 6);
    expect(estimate.annualEmployeeContributions).toBeCloseTo(
      24000 * FINNISH_EMPLOYEE_CONTRIBUTION_RATE,
      6,
    );
    expect(estimate.monthlyNet).toBeCloseTo(1737.9253, 4);
    expect(estimate.hourlyNet).toBeCloseTo(10.6949, 4);
    expect(estimate.yearlyNet).toBeCloseTo(20855.104, 6);
  });

  it('returns no estimate above the published Vero example range', () => {
    expect(
      estimateFinnishNetPay2026(
        (FINNISH_TAX_EXAMPLE_MAX_INCOME + 1) / 12,
        40,
        'weekly',
      ),
    ).toBeNull();
  });

  it('rejects invalid salary and working hours', () => {
    expect(estimateFinnishNetPay2026(0, 40, 'weekly')).toBeNull();
    expect(estimateFinnishNetPay2026(2000, 0, 'weekly')).toBeNull();
  });
});

describe('calculateGrossForNetTarget', () => {
  it('inverts the Finnish estimate for a target hourly net wage', () => {
    const gross = calculateGrossForNetTarget(
      20,
      'hourly',
      37.5,
      'weekly',
      'finnish-2026',
    );
    expect(gross).not.toBeNull();
    if (!gross) throw new Error('Expected a Finnish gross-pay target.');
    const estimate = estimateFinnishNetPay2026(
      gross.grossMonthly,
      37.5,
      'weekly',
    );
    expect(estimate?.hourlyNet).toBeCloseTo(20, 6);
    expect(gross.targetNetHourly).toBe(20);
  });

  it('inverts the Finnish estimate for a target monthly net wage', () => {
    const gross = calculateGrossForNetTarget(
      3500,
      'monthly',
      37.5,
      'weekly',
      'finnish-2026',
    );
    expect(gross).not.toBeNull();
    if (!gross) throw new Error('Expected a Finnish gross-pay target.');
    const estimate = estimateFinnishNetPay2026(
      gross.grossMonthly,
      37.5,
      'weekly',
    );
    expect(estimate?.monthlyNet).toBeCloseTo(3500, 6);
    expect(gross.grossYearly).toBeCloseTo(gross.grossMonthly * 12, 8);
  });

  it('calculates exact reverse targets with the custom flat tax rate', () => {
    const hourly = calculateGrossForNetTarget(
      20,
      'hourly',
      40,
      'weekly',
      'flat-rate',
      25,
    );
    expect(hourly?.grossHourly).toBeCloseTo(20 / 0.75, 8);
    expect(hourly?.targetNetMonthly).toBeCloseTo(20 * 40 * WEEKS_PER_MONTH, 8);

    const monthly = calculateGrossForNetTarget(
      3500,
      'monthly',
      40,
      'weekly',
      'flat-rate',
      25,
    );
    expect(monthly?.grossMonthly).toBeCloseTo(3500 / 0.75, 8);
  });

  it('rejects invalid targets and unsupported Finnish net amounts', () => {
    expect(
      calculateGrossForNetTarget(0, 'hourly', 40, 'weekly', 'finnish-2026'),
    ).toBeNull();
    expect(
      calculateGrossForNetTarget(4000, 'monthly', 40, 'weekly', 'finnish-2026'),
    ).toBeNull();
    expect(
      calculateGrossForNetTarget(100, 'hourly', 40, 'weekly', 'flat-rate', 100),
    ).toBeNull();
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
