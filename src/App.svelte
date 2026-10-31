<script lang="ts">
  import { onMount } from 'svelte';
  import {
    calculateHourlyWage,
    estimateNetPay,
    formatEuro,
    formatNumber,
    parsePositiveNumber,
    parseTaxRate,
    type HoursPeriod,
    type Language,
  } from './lib/calculator';
  import { loadPreferences, savePreferences } from './lib/preferences';

  const loaded = loadPreferences();
  const initial = loaded.preferences;

  let salary = $state(initial.salary);
  let hours = $state(initial.hours);
  let period = $state<HoursPeriod>(initial.period);
  let yearly = $state(initial.yearly);
  let taxRate = $state(initial.taxRate);
  let showNetEstimate = $state(initial.showNetEstimate);
  let language = $state<Language>(initial.language);
  let dark = $state(document.documentElement.classList.contains('dark'));
  let storageWarning = $state(!loaded.storageAvailable);
  let shareMessage = $state('');

  const translations = {
    en: {
      title: 'Hourly Wage Calculator',
      subtitle: 'Turn your salary into clear hourly and monthly figures.',
      dark: '🌙 Dark',
      light: '☀️ Light',
      switchLanguage: 'Suomi',
      monthlySalary: 'Monthly salary (gross)',
      yearlySalary: 'Yearly salary (gross)',
      workingHoursAre: 'Working hours are',
      perWeek: 'Per week',
      perMonth: 'Per month',
      hoursPerWeek: 'Hours per week',
      hoursPerMonth: 'Hours per month',
      hourlyWage: 'Your hourly wage (gross)',
      monthlyHours: 'Hours per month',
      payPerWeek: 'Pay per week',
      payPerYear: 'Pay per year',
      monthlyHint:
        'Enter a monthly salary and your working hours to see your hourly wage.',
      yearlyTitle: 'From yearly salary',
      yearlyDescription:
        'See the monthly and hourly equivalent of a yearly gross salary.',
      perMonthLabel: 'Per month',
      hourly: 'Hourly',
      estimateTitle: 'Net pay estimate',
      estimateDescription:
        'Optional estimate using a flat effective tax rate you choose.',
      enableEstimate: 'Show an estimated net pay',
      taxRate: 'Estimated effective tax rate (%)',
      estimatedNetMonth: 'Estimated net per month',
      estimatedNetHour: 'Estimated net per hour',
      estimatedNetYear: 'Estimated net per year',
      estimateCaveat:
        'This is only a simple flat-rate estimate, not a Finnish tax calculation or tax advice. Actual take-home pay depends on personal and local tax details.',
      methodology:
        'Weekly hours are converted to monthly hours using 52 weeks / 12 months (about 4.33 weeks per month). All salary figures are gross before taxes.',
      required: '{field} is required.',
      invalidPositive: 'Enter a valid number greater than zero for {field}.',
      invalidTax: 'Enter a tax rate from 0 to 100.',
      salaryField: 'monthly salary',
      hoursField: 'working hours',
      yearlyField: 'yearly salary',
      storageWarning:
        'This browser could not save your preferences on this device.',
      share: 'Share / copy result',
      shareSuccess: 'Result shared or copied.',
      shareUnavailable:
        'Sharing and clipboard access are unavailable in this browser.',
      shareFailed: 'The result could not be shared or copied.',
    },
    fi: {
      title: 'Tuntipalkkalaskuri',
      subtitle: 'Muunna palkka helposti tunti- ja kuukausipalkaksi.',
      dark: '🌙 Tumma',
      light: '☀️ Vaalea',
      switchLanguage: 'English',
      monthlySalary: 'Kuukausipalkka (brutto)',
      yearlySalary: 'Vuosipalkka (brutto)',
      workingHoursAre: 'Työtunnit ovat',
      perWeek: 'Viikossa',
      perMonth: 'Kuukaudessa',
      hoursPerWeek: 'Tuntia viikossa',
      hoursPerMonth: 'Tuntia kuukaudessa',
      hourlyWage: 'Tuntipalkkasi (brutto)',
      monthlyHours: 'Tuntia kuukaudessa',
      payPerWeek: 'Palkka viikossa',
      payPerYear: 'Palkka vuodessa',
      monthlyHint: 'Syötä kuukausipalkka ja työtunnit nähdäksesi tuntipalkan.',
      yearlyTitle: 'Vuosipalkasta',
      yearlyDescription: 'Näe vuosibruttopalkan kuukausi- ja tuntivastaavuus.',
      perMonthLabel: 'Kuukaudessa',
      hourly: 'Tunnissa',
      estimateTitle: 'Arvio nettopalkasta',
      estimateDescription:
        'Valinnainen arvio itse valitsemallasi tasaveroprosentilla.',
      enableEstimate: 'Näytä arvio nettopalkasta',
      taxRate: 'Arvioitu efektiivinen veroprosentti (%)',
      estimatedNetMonth: 'Arvio netosta kuukaudessa',
      estimatedNetHour: 'Arvio netosta tunnissa',
      estimatedNetYear: 'Arvio netosta vuodessa',
      estimateCaveat:
        'Tämä on yksinkertainen tasaveroprosenttiin perustuva arvio, ei Suomen verolaskelma tai veroneuvontaa. Todellinen nettopalkka riippuu henkilökohtaisista ja paikallisista verotiedoista.',
      methodology:
        'Viikkotunnit muunnetaan kuukausitunneiksi käyttämällä 52 viikkoa / 12 kuukautta (noin 4,33 viikkoa kuukaudessa). Palkkaluvut ovat bruttopalkkoja ennen veroja.',
      required: '{field} vaaditaan.',
      invalidPositive: 'Anna kelvollinen nollaa suurempi luku: {field}.',
      invalidTax: 'Anna veroprosentti väliltä 0–100.',
      salaryField: 'kuukausipalkka',
      hoursField: 'työtunnit',
      yearlyField: 'vuosipalkka',
      storageWarning:
        'Selain ei voinut tallentaa asetuksiasi tälle laitteelle.',
      share: 'Jaa / kopioi tulos',
      shareSuccess: 'Tulos jaettu tai kopioitu.',
      shareUnavailable:
        'Jakaminen ja leikepöytä eivät ole käytettävissä tässä selaimessa.',
      shareFailed: 'Tuloksen jakaminen tai kopiointi ei onnistunut.',
    },
  } as const;

  const copy = $derived(translations[language]);
  const salaryValue = $derived(parsePositiveNumber(salary));
  const hoursValue = $derived(parsePositiveNumber(hours));
  const yearlyValue = $derived(parsePositiveNumber(yearly));
  const taxRateValue = $derived(parseTaxRate(taxRate));

  const result = $derived(
    salaryValue !== null && hoursValue !== null
      ? calculateHourlyWage(salaryValue, hoursValue, period)
      : null,
  );
  const yearlyMonthly = $derived(
    yearlyValue === null ? null : yearlyValue / 12,
  );
  const yearlyResult = $derived(
    yearlyMonthly !== null && hoursValue !== null
      ? calculateHourlyWage(yearlyMonthly, hoursValue, period)
      : null,
  );
  const netEstimate = $derived(
    showNetEstimate &&
      salaryValue !== null &&
      hoursValue !== null &&
      taxRateValue !== null
      ? estimateNetPay(salaryValue, hoursValue, period, taxRateValue)
      : null,
  );

  const salaryError = $derived(getPositiveInputError(salary, copy.salaryField));
  const hoursError = $derived(getPositiveInputError(hours, copy.hoursField));
  const yearlyError = $derived(getPositiveInputError(yearly, copy.yearlyField));
  const taxRateError = $derived(
    showNetEstimate && taxRateValue === null ? copy.invalidTax : '',
  );

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 py-2.5 px-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40';
  const labelClass =
    'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
  const errorClass = 'mt-1 text-sm text-red-700 dark:text-red-300';
  const segClass =
    'block rounded-md py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300 peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow dark:peer-checked:bg-slate-700 dark:peer-checked:text-indigo-300';

  function getPositiveInputError(value: string, field: string): string {
    if (!value.trim()) return copy.required.replace('{field}', field);
    if (parsePositiveNumber(value) === null) {
      return copy.invalidPositive.replace('{field}', field);
    }
    return '';
  }

  function applyTheme(isDark: boolean): void {
    dark = isDark;
    document.documentElement.classList.toggle('dark', isDark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#020617' : '#4f46e5');
  }

  function toggleTheme(): void {
    const nextDark = !dark;
    applyTheme(nextDark);
    try {
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    } catch {
      storageWarning = true;
    }
  }

  function toggleLanguage(): void {
    language = language === 'en' ? 'fi' : 'en';
  }

  async function shareResult(): Promise<void> {
    if (!result) return;

    const text = `${copy.hourlyWage}: ${formatEuro(result.hourly, language)}. ${copy.payPerYear}: ${formatEuro(result.yearlyPay, language)}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: copy.title, text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        shareMessage = copy.shareUnavailable;
        return;
      }
      shareMessage = copy.shareSuccess;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      shareMessage = copy.shareFailed;
    }
  }

  $effect(() => {
    if (
      !savePreferences({
        salary,
        hours,
        period,
        yearly,
        taxRate,
        showNetEstimate,
        language,
      })
    ) {
      storageWarning = true;
    }
    document.documentElement.lang = language;
    document.title = copy.title;
  });

  onMount(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem('theme') === null) applyTheme(event.matches);
      } catch {
        storageWarning = true;
        applyTheme(event.matches);
      }
    };

    try {
      const savedTheme = localStorage.getItem('theme');
      const inheritedTheme =
        document.documentElement.classList.contains('dark');
      applyTheme(
        savedTheme === 'dark' || (savedTheme === null && inheritedTheme),
      );
    } catch {
      storageWarning = true;
      applyTheme(colorScheme.matches);
    }

    colorScheme.addEventListener('change', syncSystemTheme);
    return () => colorScheme.removeEventListener('change', syncSystemTheme);
  });
</script>

<main
  class="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-200 sm:p-8"
>
  <div
    class="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-8 lg:p-10"
  >
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1
          class="text-2xl font-bold text-slate-900 dark:text-white lg:text-3xl"
        >
          {copy.title}
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {copy.subtitle}
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap justify-end gap-2">
        <button
          type="button"
          onclick={toggleLanguage}
          aria-label="Switch language"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {copy.switchLanguage}
        </button>
        <button
          type="button"
          onclick={toggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={dark}
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {dark ? copy.light : copy.dark}
        </button>
      </div>
    </header>

    <div class="grid gap-8 lg:grid-cols-2">
      <div>
        <form
          class="space-y-5"
          onsubmit={(event) => event.preventDefault()}
          novalidate
        >
          <div>
            <label for="salary" class={labelClass}>{copy.monthlySalary}</label>
            <div class="relative">
              <span
                class="absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-slate-400"
                aria-hidden="true">€</span
              >
              <input
                id="salary"
                type="text"
                inputmode="decimal"
                placeholder="3000"
                bind:value={salary}
                aria-invalid={Boolean(salaryError)}
                aria-describedby={salaryError ? 'salary-error' : undefined}
                class="{inputClass} !pl-8"
              />
            </div>
            {#if salaryError}
              <p id="salary-error" class={errorClass} role="alert">
                {salaryError}
              </p>
            {/if}
          </div>

          <fieldset>
            <legend class={labelClass}>{copy.workingHoursAre}</legend>
            <div
              class="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            >
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value="weekly"
                  bind:group={period}
                  class="peer sr-only"
                />
                <span class={segClass}>{copy.perWeek}</span>
              </label>
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value="monthly"
                  bind:group={period}
                  class="peer sr-only"
                />
                <span class={segClass}>{copy.perMonth}</span>
              </label>
            </div>
          </fieldset>

          <div>
            <label for="hours" class={labelClass}>
              {period === 'weekly' ? copy.hoursPerWeek : copy.hoursPerMonth}
            </label>
            <input
              id="hours"
              type="text"
              inputmode="decimal"
              placeholder={period === 'weekly' ? '37.5' : '173'}
              bind:value={hours}
              aria-invalid={Boolean(hoursError)}
              aria-describedby={hoursError ? 'hours-error' : undefined}
              class={inputClass}
            />
            {#if hoursError}
              <p id="hours-error" class={errorClass} role="alert">
                {hoursError}
              </p>
            {/if}
          </div>
        </form>

        <section
          class="mt-8 rounded-xl bg-indigo-50 p-5 dark:bg-indigo-950/50"
          aria-live="polite"
          aria-label={copy.hourlyWage}
        >
          {#if result}
            <p class="text-sm text-indigo-700 dark:text-indigo-300">
              {copy.hourlyWage}
            </p>
            <p
              class="mt-1 text-4xl font-bold text-indigo-900 dark:text-indigo-100"
              data-testid="hourly"
            >
              {formatEuro(result.hourly, language)}
            </p>

            <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-white p-3 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">
                  {copy.monthlyHours}
                </dt>
                <dd class="font-semibold text-slate-900 dark:text-white">
                  {formatNumber(result.monthlyHours, language)}
                </dd>
              </div>
              <div class="rounded-lg bg-white p-3 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">
                  {copy.payPerWeek}
                </dt>
                <dd class="font-semibold text-slate-900 dark:text-white">
                  {formatEuro(result.weeklyPay, language)}
                </dd>
              </div>
              <div class="col-span-2 rounded-lg bg-white p-3 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">
                  {copy.payPerYear}
                </dt>
                <dd class="font-semibold text-slate-900 dark:text-white">
                  {formatEuro(result.yearlyPay, language)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onclick={shareResult}
              class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-indigo-950"
            >
              {copy.share}
            </button>
            {#if shareMessage}
              <p
                class="mt-2 text-sm text-indigo-700 dark:text-indigo-300"
                role="status"
              >
                {shareMessage}
              </p>
            {/if}
          {:else}
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {copy.monthlyHint}
            </p>
          {/if}
        </section>

        <section
          class="mt-6 rounded-xl border border-slate-200 p-5 dark:border-slate-700"
          aria-labelledby="net-estimate-title"
        >
          <h2
            id="net-estimate-title"
            class="text-lg font-semibold text-slate-900 dark:text-white"
          >
            {copy.estimateTitle}
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {copy.estimateDescription}
          </p>
          <label class="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              bind:checked={showNetEstimate}
              class="mt-0.5 size-4 accent-indigo-600"
            />
            <span>{copy.enableEstimate}</span>
          </label>

          {#if showNetEstimate}
            <div class="mt-4">
              <label for="tax-rate" class={labelClass}>{copy.taxRate}</label>
              <div class="relative">
                <input
                  id="tax-rate"
                  type="text"
                  inputmode="decimal"
                  bind:value={taxRate}
                  aria-invalid={Boolean(taxRateError)}
                  aria-describedby={taxRateError
                    ? 'tax-rate-error'
                    : 'tax-rate-help'}
                  class="{inputClass} !pr-8"
                />
                <span
                  class="absolute inset-y-0 right-3 flex items-center text-slate-500 dark:text-slate-400"
                  aria-hidden="true">%</span
                >
              </div>
              <p
                id="tax-rate-help"
                class="mt-1 text-xs text-slate-500 dark:text-slate-400"
              >
                {copy.estimateCaveat}
              </p>
              {#if taxRateError}
                <p id="tax-rate-error" class={errorClass} role="alert">
                  {taxRateError}
                </p>
              {/if}

              {#if netEstimate}
                <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <dt class="text-slate-500 dark:text-slate-400">
                      {copy.estimatedNetMonth}
                    </dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">
                      {formatEuro(netEstimate.monthlyNet, language)}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <dt class="text-slate-500 dark:text-slate-400">
                      {copy.estimatedNetHour}
                    </dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">
                      {formatEuro(netEstimate.hourlyNet, language)}
                    </dd>
                  </div>
                  <div
                    class="col-span-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                  >
                    <dt class="text-slate-500 dark:text-slate-400">
                      {copy.estimatedNetYear}
                    </dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">
                      {formatEuro(netEstimate.yearlyNet, language)}
                    </dd>
                  </div>
                </dl>
              {/if}
            </div>
          {/if}
        </section>
      </div>

      <div>
        <section
          class="rounded-xl p-5 ring-1 ring-slate-200 dark:ring-slate-700"
          aria-labelledby="yearly-title"
        >
          <h2
            id="yearly-title"
            class="text-lg font-semibold text-slate-900 dark:text-white"
          >
            {copy.yearlyTitle}
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {copy.yearlyDescription}
          </p>

          <div class="mt-4">
            <label for="yearly" class={labelClass}>{copy.yearlySalary}</label>
            <div class="relative">
              <span
                class="absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-slate-400"
                aria-hidden="true">€</span
              >
              <input
                id="yearly"
                type="text"
                inputmode="decimal"
                placeholder="24000"
                bind:value={yearly}
                aria-invalid={Boolean(yearlyError)}
                aria-describedby={yearlyError ? 'yearly-error' : undefined}
                class="{inputClass} !pl-8"
              />
            </div>
            {#if yearlyError}
              <p id="yearly-error" class={errorClass} role="alert">
                {yearlyError}
              </p>
            {/if}
          </div>

          {#if yearlyResult && yearlyMonthly !== null}
            <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">
                  {copy.perMonthLabel}
                </dt>
                <dd
                  class="font-semibold text-slate-900 dark:text-white"
                  data-testid="yearly-monthly"
                >
                  {formatEuro(yearlyMonthly, language)}
                </dd>
              </div>
              <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <dt class="text-slate-500 dark:text-slate-400">
                  {copy.hourly}
                </dt>
                <dd
                  class="font-semibold text-slate-900 dark:text-white"
                  data-testid="yearly-hourly"
                >
                  {formatEuro(yearlyResult.hourly, language)}
                </dd>
              </div>
            </dl>
          {/if}
        </section>

        <p class="mt-6 text-xs text-slate-400 dark:text-slate-500">
          {copy.methodology}
        </p>
      </div>
    </div>

    {#if storageWarning}
      <p class="mt-6 text-sm text-amber-700 dark:text-amber-300" role="status">
        {copy.storageWarning}
      </p>
    {/if}
  </div>
</main>
