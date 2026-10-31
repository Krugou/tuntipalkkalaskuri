export type HoursPeriod = 'weekly' | 'monthly';
export type Language = 'en' | 'fi';
export type NetEstimateMode = 'finnish-2026' | 'flat-rate';
export type NetTargetPeriod = 'monthly' | 'hourly';

export const WEEKS_PER_MONTH = 52 / 12;
export const FINNISH_TAX_EXAMPLE_MAX_INCOME = 70_000;
export const FINNISH_EMPLOYEE_CONTRIBUTION_RATE = 0.0819;

export interface HourlyWageResult {
  hourly: number;
  monthlyHours: number;
  weeklyPay: number;
  yearlyPay: number;
}

export interface NetPayEstimate {
  monthlyNet: number;
  hourlyNet: number;
  yearlyNet: number;
}

export interface FinnishNetPayEstimate extends NetPayEstimate {
  annualGross: number;
  annualTax: number;
  annualEmployeeContributions: number;
}

export interface GrossPayTarget {
  grossMonthly: number;
  grossYearly: number;
  grossHourly: number;
  targetNetMonthly: number;
  targetNetHourly: number;
}

// Vero's 2026 Helsinki wage examples; linear interpolation is only an estimate.
const finnishTaxExamples2026 = [
  { annualGross: 10_000, annualTax: 0 },
  { annualGross: 16_000, annualTax: 2.5 },
  { annualGross: 20_000, annualTax: 278.5 },
  { annualGross: 30_000, annualTax: 2_530.49 },
  { annualGross: 40_000, annualTax: 5_511.99 },
  { annualGross: 50_000, annualTax: 9_361.96 },
  { annualGross: 60_000, annualTax: 13_244.84 },
  { annualGross: 70_000, annualTax: 17_415.6 },
] as const;

export function parsePositiveNumber(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseTaxRate(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function calculateHourlyWage(
  monthlySalary: number,
  hours: number,
  period: HoursPeriod,
): HourlyWageResult | null {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;

  const monthlyHours = period === 'weekly' ? hours * WEEKS_PER_MONTH : hours;
  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) return null;
  const hourly = monthlySalary / monthlyHours;

  return {
    hourly,
    monthlyHours,
    weeklyPay: monthlySalary / WEEKS_PER_MONTH,
    yearlyPay: monthlySalary * 12,
  };
}

export function estimateNetPay(
  monthlySalary: number,
  hours: number,
  period: HoursPeriod,
  taxRate: number,
): NetPayEstimate | null {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) return null;

  const monthlyHours = period === 'weekly' ? hours * WEEKS_PER_MONTH : hours;
  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) return null;

  const monthlyNet = monthlySalary * (1 - taxRate / 100);
  return {
    monthlyNet,
    hourlyNet: monthlyNet / monthlyHours,
    yearlyNet: monthlyNet * 12,
  };
}

export function estimateFinnishNetPay2026(
  monthlySalary: number,
  hours: number,
  period: HoursPeriod,
): FinnishNetPayEstimate | null {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;

  const annualGross = monthlySalary * 12;
  if (
    !Number.isFinite(annualGross) ||
    annualGross > FINNISH_TAX_EXAMPLE_MAX_INCOME
  ) {
    return null;
  }

  const monthlyHours = period === 'weekly' ? hours * WEEKS_PER_MONTH : hours;
  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) return null;

  const annualTax = interpolateFinnishTax2026(annualGross);
  const annualEmployeeContributions =
    annualGross * FINNISH_EMPLOYEE_CONTRIBUTION_RATE;
  const yearlyNet = Math.max(
    0,
    annualGross - annualTax - annualEmployeeContributions,
  );
  const monthlyNet = yearlyNet / 12;

  return {
    annualGross,
    annualTax,
    annualEmployeeContributions,
    monthlyNet,
    hourlyNet: monthlyNet / monthlyHours,
    yearlyNet,
  };
}

export function calculateGrossForNetTarget(
  targetNet: number,
  targetPeriod: NetTargetPeriod,
  hours: number,
  hoursPeriod: HoursPeriod,
  estimateMode: NetEstimateMode,
  taxRate?: number,
): GrossPayTarget | null {
  if (!Number.isFinite(targetNet) || targetNet <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;

  const monthlyHours =
    hoursPeriod === 'weekly' ? hours * WEEKS_PER_MONTH : hours;
  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) return null;

  const targetNetMonthly =
    targetPeriod === 'hourly' ? targetNet * monthlyHours : targetNet;
  if (!Number.isFinite(targetNetMonthly) || targetNetMonthly <= 0) return null;

  let grossMonthly: number;
  if (estimateMode === 'flat-rate') {
    if (
      taxRate === undefined ||
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate >= 100
    ) {
      return null;
    }
    grossMonthly = targetNetMonthly / (1 - taxRate / 100);
  } else {
    const upperBoundMonthly = FINNISH_TAX_EXAMPLE_MAX_INCOME / 12;
    if (
      targetNetMonthly >
      calculateFinnishMonthlyNet(upperBoundMonthly) + 1e-8
    ) {
      return null;
    }

    let low = 0;
    let high = upperBoundMonthly;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const midpoint = (low + high) / 2;
      if (calculateFinnishMonthlyNet(midpoint) < targetNetMonthly) {
        low = midpoint;
      } else {
        high = midpoint;
      }
    }
    grossMonthly = (low + high) / 2;
  }

  if (!Number.isFinite(grossMonthly) || grossMonthly <= 0) return null;

  return {
    grossMonthly,
    grossYearly: grossMonthly * 12,
    grossHourly: grossMonthly / monthlyHours,
    targetNetMonthly,
    targetNetHourly: targetNetMonthly / monthlyHours,
  };
}

function calculateFinnishMonthlyNet(monthlyGross: number): number {
  const annualGross = monthlyGross * 12;
  const annualTax = interpolateFinnishTax2026(annualGross);
  const annualEmployeeContributions =
    annualGross * FINNISH_EMPLOYEE_CONTRIBUTION_RATE;
  return Math.max(
    0,
    (annualGross - annualTax - annualEmployeeContributions) / 12,
  );
}

function interpolateFinnishTax2026(annualGross: number): number {
  if (annualGross <= finnishTaxExamples2026[0].annualGross) return 0;

  for (let index = 1; index < finnishTaxExamples2026.length; index += 1) {
    const upper = finnishTaxExamples2026[index];
    if (annualGross <= upper.annualGross) {
      const lower = finnishTaxExamples2026[index - 1];
      const progress =
        (annualGross - lower.annualGross) /
        (upper.annualGross - lower.annualGross);
      return lower.annualTax + progress * (upper.annualTax - lower.annualTax);
    }
  }

  return finnishTaxExamples2026[finnishTaxExamples2026.length - 1].annualTax;
}

export function formatEuro(value: number, language: Language = 'en'): string {
  return new Intl.NumberFormat(language === 'fi' ? 'fi-FI' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, language: Language = 'en'): string {
  return new Intl.NumberFormat(language === 'fi' ? 'fi-FI' : 'en-IE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
