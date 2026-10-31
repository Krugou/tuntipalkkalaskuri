export type HoursPeriod = 'weekly' | 'monthly';
export type Language = 'en' | 'fi';

export const WEEKS_PER_MONTH = 52 / 12;

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
