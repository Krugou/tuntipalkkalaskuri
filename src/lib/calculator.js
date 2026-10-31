// Average number of weeks in a month: 52 weeks / 12 months.
export const WEEKS_PER_MONTH = 52 / 12;

/**
 * Converts a monthly salary to an hourly wage.
 *
 * @param {number} monthlySalary Gross monthly salary.
 * @param {number} hours Working hours entered by the user.
 * @param {'weekly' | 'monthly'} period Whether `hours` is per week or per month.
 * @returns {{ hourly: number, monthlyHours: number, weeklyPay: number, yearlyPay: number } | null}
 *   null when the input is not a valid positive number.
 */
export function calculateHourlyWage(monthlySalary, hours, period) {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;

  const monthlyHours = period === 'weekly' ? hours * WEEKS_PER_MONTH : hours;
  const hourly = monthlySalary / monthlyHours;

  return {
    hourly,
    monthlyHours,
    weeklyPay: monthlySalary / WEEKS_PER_MONTH,
    yearlyPay: monthlySalary * 12,
  };
}

/** Formats a number as a euro amount with two decimals. */
export function formatEuro(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
