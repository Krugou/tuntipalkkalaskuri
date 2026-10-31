<script>
  import { calculateHourlyWage, formatEuro } from './lib/calculator.js';

  let salary = $state('2000');
  let hours = $state('40');
  let period = $state('weekly');

  const salaryValue = $derived(parseFloat(salary.replace(',', '.')));
  const hoursValue = $derived(parseFloat(hours.replace(',', '.')));
  const result = $derived(calculateHourlyWage(salaryValue, hoursValue, period));
</script>

<main class="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 sm:p-8">
  <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 p-6 sm:p-8">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Hourly Wage Calculator</h1>
      <p class="text-sm text-slate-500 mt-1">Turn your monthly salary into an hourly wage.</p>
    </header>

    <form class="space-y-5" onsubmit={(event) => event.preventDefault()}>
      <div>
        <label for="salary" class="block text-sm font-medium text-slate-700 mb-1">Monthly salary (gross)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-500">€</span>
          <input
            id="salary"
            type="text"
            inputmode="decimal"
            placeholder="3000"
            bind:value={salary}
            class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-8 pr-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <fieldset>
        <legend class="block text-sm font-medium text-slate-700 mb-1">Working hours are</legend>
        <div class="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <label class="cursor-pointer">
            <input type="radio" name="period" value="weekly" bind:group={period} class="peer sr-only" />
            <span class="block rounded-md py-2 text-center text-sm font-medium text-slate-600 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow">
              Per week
            </span>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="period" value="monthly" bind:group={period} class="peer sr-only" />
            <span class="block rounded-md py-2 text-center text-sm font-medium text-slate-600 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow">
              Per month
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label for="hours" class="block text-sm font-medium text-slate-700 mb-1">
          Hours {period === 'weekly' ? 'per week' : 'per month'}
        </label>
        <input
          id="hours"
          type="text"
          inputmode="decimal"
          placeholder={period === 'weekly' ? '40' : '173'}
          bind:value={hours}
          class="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
    </form>

    <section class="mt-8 rounded-xl bg-indigo-50 p-5" aria-live="polite">
      {#if result}
        <p class="text-sm text-indigo-700">Your hourly wage</p>
        <p class="text-4xl font-bold text-indigo-900 mt-1">{formatEuro(result.hourly)}</p>

        <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-lg bg-white p-3">
            <dt class="text-slate-500">Hours per month</dt>
            <dd class="font-semibold text-slate-900">{result.monthlyHours.toFixed(1)}</dd>
          </div>
          <div class="rounded-lg bg-white p-3">
            <dt class="text-slate-500">Pay per week</dt>
            <dd class="font-semibold text-slate-900">{formatEuro(result.weeklyPay)}</dd>
          </div>
          <div class="rounded-lg bg-white p-3 col-span-2">
            <dt class="text-slate-500">Pay per year</dt>
            <dd class="font-semibold text-slate-900">{formatEuro(result.yearlyPay)}</dd>
          </div>
        </dl>
      {:else}
        <p class="text-sm text-slate-500">
          Enter a monthly salary and your working hours to see your hourly wage.
        </p>
      {/if}
    </section>

    <p class="mt-6 text-xs text-slate-400">
      Weekly hours are converted to monthly hours using 52 weeks / 12 months (≈ 4.33 weeks per month).
      Figures are gross and before taxes.
    </p>
  </div>
</main>
