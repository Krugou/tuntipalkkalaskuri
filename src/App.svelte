<script>
  import { calculateHourlyWage, formatEuro } from './lib/calculator.js';

  let salary = $state('2000');
  let hours = $state('37.5');
  let period = $state('weekly');

  const salaryValue = $derived(parseFloat(salary.replace(',', '.')));
  const hoursValue = $derived(parseFloat(hours.replace(',', '.')));
  const result = $derived(calculateHourlyWage(salaryValue, hoursValue, period));

  let yearly = $state('24000');
  const yearlyValue = $derived(parseFloat(yearly.replace(',', '.')));
  const yearlyMonthly = $derived(yearlyValue / 12);
  const yearlyResult = $derived(calculateHourlyWage(yearlyMonthly, hoursValue, period));

  let dark = $state(false);
  $effect(() => {
    dark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {}
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 py-2.5 px-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
  const segClass =
    'block rounded-md py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow dark:peer-checked:bg-slate-700 dark:peer-checked:text-indigo-300';
</script>

<main class="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200 flex items-center justify-center p-4 sm:p-8">
  <div class="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 p-6 sm:p-8 lg:p-10">
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Hourly Wage Calculator</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Turn your monthly salary into an hourly wage.</p>
      </div>
      <button
        type="button"
        onclick={toggleTheme}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
        class="shrink-0 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {dark ? '☀️ Light' : '🌙 Dark'}
      </button>
    </header>

    <div class="grid gap-8 lg:grid-cols-2">
    <div>
    <form class="space-y-5" onsubmit={(event) => event.preventDefault()}>
      <div>
        <label for="salary" class={labelClass}>Monthly salary (gross)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-slate-400">€</span>
          <input
            id="salary"
            type="text"
            inputmode="decimal"
            placeholder="3000"
            bind:value={salary}
            class="{inputClass} !pl-8"
          />
        </div>
      </div>

      <fieldset>
        <legend class={labelClass}>Working hours are</legend>
        <div class="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <label class="cursor-pointer">
            <input type="radio" name="period" value="weekly" bind:group={period} class="peer sr-only" />
            <span class={segClass}>Per week</span>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="period" value="monthly" bind:group={period} class="peer sr-only" />
            <span class={segClass}>Per month</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label for="hours" class={labelClass}>
          Hours {period === 'weekly' ? 'per week' : 'per month'}
        </label>
        <input
          id="hours"
          type="text"
          inputmode="decimal"
          placeholder={period === 'weekly' ? '37.5' : '173'}
          bind:value={hours}
          class={inputClass}
        />
      </div>
    </form>

    <section class="mt-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-5" aria-live="polite">
      {#if result}
        <p class="text-sm text-indigo-700 dark:text-indigo-300">Your hourly wage</p>
        <p class="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mt-1" data-testid="hourly">{formatEuro(result.hourly)}</p>

        <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-lg bg-white dark:bg-slate-800 p-3">
            <dt class="text-slate-500 dark:text-slate-400">Hours per month</dt>
            <dd class="font-semibold text-slate-900 dark:text-white">{result.monthlyHours.toFixed(1)}</dd>
          </div>
          <div class="rounded-lg bg-white dark:bg-slate-800 p-3">
            <dt class="text-slate-500 dark:text-slate-400">Pay per week</dt>
            <dd class="font-semibold text-slate-900 dark:text-white">{formatEuro(result.weeklyPay)}</dd>
          </div>
          <div class="rounded-lg bg-white dark:bg-slate-800 p-3 col-span-2">
            <dt class="text-slate-500 dark:text-slate-400">Pay per year</dt>
            <dd class="font-semibold text-slate-900 dark:text-white">{formatEuro(result.yearlyPay)}</dd>
          </div>
        </dl>
      {:else}
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Enter a monthly salary and your working hours to see your hourly wage.
        </p>
      {/if}
    </section>
    </div>

    <div>
    <section class="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 p-5">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">From yearly salary</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter a yearly gross salary to see its monthly and hourly equivalent.</p>

      <div class="mt-4">
        <label for="yearly" class={labelClass}>Yearly salary (gross)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-slate-400">€</span>
          <input
            id="yearly"
            type="text"
            inputmode="decimal"
            placeholder="24000"
            bind:value={yearly}
            class="{inputClass} !pl-8"
          />
        </div>
      </div>

      {#if yearlyResult}
        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <dt class="text-slate-500 dark:text-slate-400">Per month</dt>
            <dd class="font-semibold text-slate-900 dark:text-white" data-testid="yearly-monthly">{formatEuro(yearlyMonthly)}</dd>
          </div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <dt class="text-slate-500 dark:text-slate-400">Hourly</dt>
            <dd class="font-semibold text-slate-900 dark:text-white" data-testid="yearly-hourly">{formatEuro(yearlyResult.hourly)}</dd>
          </div>
        </dl>
      {/if}
    </section>

    <p class="mt-6 text-xs text-slate-400 dark:text-slate-500">
      Weekly hours are converted to monthly hours using 52 weeks / 12 months (≈ 4.33 weeks per month).
      Figures are gross and before taxes.
    </p>
    </div>
    </div>
  </div>
</main>
