<script lang="ts">
  import { onMount } from 'svelte';
  import {
    calculateHourlyWage,
    calculateGrossForNetTarget,
    estimateFinnishNetPay2026,
    estimateNetPay,
    FINNISH_TAX_EXAMPLE_MAX_INCOME,
    formatEuro,
    formatNumber,
    parsePositiveNumber,
    parseTaxRate,
    type HoursPeriod,
    type Language,
    type NetEstimateMode,
    type NetTargetPeriod,
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
  let estimateMode = $state<NetEstimateMode>(initial.estimateMode);
  let showReverseMode = $state(initial.showReverseMode);
  let netTarget = $state(initial.netTarget);
  let netTargetPeriod = $state<NetTargetPeriod>(initial.netTargetPeriod);
  let hourlySectionOpen = $state(initial.hourlySectionOpen);
  let netSectionOpen = $state(initial.netSectionOpen);
  let yearlySectionOpen = $state(initial.yearlySectionOpen);
  let wideLayout = $state(initial.wideLayout);
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
      wideLayout: 'Wide layout',
      standardLayout: 'Standard layout',
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
        'Use 2026 Finnish tax examples based on your monthly salary, or enter a custom flat rate.',
      enableEstimate: 'Show an estimated net pay',
      estimateMode: 'Estimate method',
      finnishEstimateMode: 'Finnish estimate (2026)',
      flatRateMode: 'Custom flat tax rate',
      finnishEstimateAssumptions:
        'Income tax is interpolated from the Finnish Tax Administration’s 2026 example amounts for Helsinki (age 17–64, Evangelical-Lutheran church member, only wage income, no underage children, standard automatic deductions). Employee pension and unemployment contributions are estimated at 8.19%. This is not a tax-card calculation.',
      finnishEstimateLimit:
        'The published examples cover annual salaries up to €70,000. Use the official calculator for higher income or a personal estimate.',
      veroExamples: 'Vero.fi 2026 tax examples',
      veroCalculator: 'official tax calculator',
      estimatedTaxYear: 'Estimated income tax per year',
      estimatedContributionsYear:
        'Estimated pension and unemployment contributions per year',
      taxRate: 'Estimated effective tax rate (%)',
      estimatedNetMonth: 'Estimated net per month',
      estimatedNetHour: 'Estimated net per hour',
      estimatedNetYear: 'Estimated net per year',
      reverseMode: 'Find the gross salary needed for a net target',
      netTargetLabel: 'Target take-home pay',
      targetHourly: 'Per hour',
      targetMonthly: 'Per month',
      targetPeriod: 'Target period',
      grossRequiredMonthly: 'Required gross per month',
      grossRequiredYearly: 'Required gross per year',
      grossRequiredHourly: 'Required gross per hour',
      reverseTargetError: 'Enter a valid target amount greater than zero.',
      reverseTargetAboveLimit:
        'This target is above the Finnish estimate range. Reduce the target or use the official Vero calculator.',
      reverseFlatRateLimit:
        'A 100% flat tax rate cannot produce a finite gross target.',
      reverseGrossLimit:
        'The gross salary needed is outside the supported Finnish estimate range.',
      estimateCaveat:
        'This custom flat-rate estimate is not a Finnish tax calculation or tax advice.',
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
      wideLayout: 'Leveä näkymä',
      standardLayout: 'Normaali näkymä',
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
        'Käytä vuoden 2026 Suomen veroarviota kuukausipalkan perusteella tai syötä oma tasaveroprosentti.',
      enableEstimate: 'Näytä arvio nettopalkasta',
      estimateMode: 'Arviotapa',
      finnishEstimateMode: 'Suomen veroarvio (2026)',
      flatRateMode: 'Oma tasaveroprosentti',
      finnishEstimateAssumptions:
        'Tulovero interpoloidaan Verohallinnon vuoden 2026 Helsinki-esimerkeistä (17–64-vuotias, evankelis-luterilaisen kirkon jäsen, vain palkkatuloja, ei alaikäisiä huollettavia, automaattiset vähennykset). Työntekijän eläke- ja työttömyysvakuutusmaksuksi arvioidaan 8,19 %. Tämä ei ole verokorttilaskelma.',
      finnishEstimateLimit:
        'Julkaistut esimerkit kattavat enintään 70 000 € vuositulot. Käytä virallista laskuria tätä suuremmilla tuloilla tai henkilökohtaiseen arvioon.',
      veroExamples: 'Vero.fi: vuoden 2026 veroesimerkit',
      veroCalculator: 'virallinen verolaskuri',
      estimatedTaxYear: 'Arvio tuloverosta vuodessa',
      estimatedContributionsYear:
        'Arvio eläke- ja työttömyysvakuutusmaksuista vuodessa',
      taxRate: 'Arvioitu efektiivinen veroprosentti (%)',
      estimatedNetMonth: 'Arvio netosta kuukaudessa',
      estimatedNetHour: 'Arvio netosta tunnissa',
      estimatedNetYear: 'Arvio netosta vuodessa',
      reverseMode: 'Laske nettopalkkatavoitteen vaatima bruttopalkka',
      netTargetLabel: 'Tavoiteltu nettopalkka',
      targetHourly: 'Tunnissa',
      targetMonthly: 'Kuukaudessa',
      targetPeriod: 'Tavoitteen jakso',
      grossRequiredMonthly: 'Tarvittava brutto kuukaudessa',
      grossRequiredYearly: 'Tarvittava brutto vuodessa',
      grossRequiredHourly: 'Tarvittava brutto tunnissa',
      reverseTargetError: 'Anna kelvollinen nollaa suurempi tavoitesumma.',
      reverseTargetAboveLimit:
        'Tavoite ylittää suomalaisen arvion tulorajan. Pienennä tavoitetta tai käytä Verohallinnon laskuria.',
      reverseFlatRateLimit:
        '100 % tasaveroprosentilla ei voida laskea äärellistä bruttopalkkaa.',
      reverseGrossLimit:
        'Tarvittava bruttopalkka ylittää suomalaisen arvion tulorajan.',
      estimateCaveat:
        'Tämä itse valittuun tasaveroprosenttiin perustuva arvio ei ole Suomen verolaskelma eikä veroneuvontaa.',
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
  const netTargetValue = $derived(parsePositiveNumber(netTarget));

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
    showNetEstimate && estimateMode === 'finnish-2026'
      ? salaryValue !== null && hoursValue !== null
        ? estimateFinnishNetPay2026(salaryValue, hoursValue, period)
        : null
      : showNetEstimate &&
          salaryValue !== null &&
          hoursValue !== null &&
          taxRateValue !== null
        ? estimateNetPay(salaryValue, hoursValue, period, taxRateValue)
        : null,
  );
  const finnishEstimate = $derived(
    showNetEstimate &&
      estimateMode === 'finnish-2026' &&
      salaryValue !== null &&
      hoursValue !== null
      ? estimateFinnishNetPay2026(salaryValue, hoursValue, period)
      : null,
  );
  const finnishEstimateOverLimit = $derived(
    showNetEstimate &&
      estimateMode === 'finnish-2026' &&
      salaryValue !== null &&
      salaryValue * 12 > FINNISH_TAX_EXAMPLE_MAX_INCOME,
  );
  const taxRateError = $derived(
    (showNetEstimate || showReverseMode) &&
      estimateMode === 'flat-rate' &&
      taxRateValue === null
      ? copy.invalidTax
      : '',
  );
  const reverseTarget = $derived(
    showReverseMode && netTargetValue !== null && hoursValue !== null
      ? calculateGrossForNetTarget(
          netTargetValue,
          netTargetPeriod,
          hoursValue,
          period,
          estimateMode,
          taxRateValue ?? undefined,
        )
      : null,
  );
  const reverseTargetError = $derived(
    showReverseMode && netTargetValue === null ? copy.reverseTargetError : '',
  );
  const reverseTargetUnavailable = $derived(
    showReverseMode &&
      netTargetValue !== null &&
      hoursValue !== null &&
      taxRateError === '' &&
      reverseTarget === null,
  );

  const salaryError = $derived(getPositiveInputError(salary, copy.salaryField));
  const hoursError = $derived(getPositiveInputError(hours, copy.hoursField));
  const yearlyError = $derived(getPositiveInputError(yearly, copy.yearlyField));

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
        estimateMode,
        showReverseMode,
        netTarget,
        netTargetPeriod,
        hourlySectionOpen,
        netSectionOpen,
        yearlySectionOpen,
        wideLayout,
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
    class="w-full rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-8 lg:p-10 {wideLayout
      ? 'max-w-screen-2xl'
      : 'max-w-5xl'}"
  >
    <header
      class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row"
    >
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
      <div class="flex w-full shrink-0 flex-wrap justify-end gap-2 sm:w-auto">
        <button
          type="button"
          onclick={() => (wideLayout = !wideLayout)}
          aria-label={wideLayout ? copy.standardLayout : copy.wideLayout}
          aria-pressed={wideLayout}
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {wideLayout ? copy.standardLayout : copy.wideLayout}
        </button>
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

        <details
          bind:open={hourlySectionOpen}
          data-testid="hourly-section"
          class="mt-8 rounded-xl bg-indigo-50 p-5 dark:bg-indigo-950/50"
        >
          <summary
            class="cursor-pointer select-none font-semibold text-indigo-900 dark:text-indigo-100"
          >
            {copy.hourlyWage}
          </summary>
          <div class="mt-4" aria-live="polite" aria-label={copy.hourlyWage}>
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
                <div
                  class="col-span-2 rounded-lg bg-white p-3 dark:bg-slate-800"
                >
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
          </div>
        </details>

        <details
          bind:open={netSectionOpen}
          data-testid="net-section"
          class="mt-6 rounded-xl border border-slate-200 p-5 dark:border-slate-700"
        >
          <summary class="cursor-pointer select-none">
            <h2
              id="net-estimate-title"
              class="inline text-lg font-semibold text-slate-900 dark:text-white"
            >
              {copy.estimateTitle}
            </h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {copy.estimateDescription}
            </p>
          </summary>
          <label class="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              bind:checked={showNetEstimate}
              class="mt-0.5 size-4 accent-indigo-600"
            />
            <span>{copy.enableEstimate}</span>
          </label>
          <label class="mt-3 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              bind:checked={showReverseMode}
              class="mt-0.5 size-4 accent-indigo-600"
            />
            <span>{copy.reverseMode}</span>
          </label>

          {#if showNetEstimate || showReverseMode}
            <div class="mt-4">
              <label for="estimate-mode" class={labelClass}>
                {copy.estimateMode}
              </label>
              <select
                id="estimate-mode"
                bind:value={estimateMode}
                class={inputClass}
              >
                <option value="finnish-2026">{copy.finnishEstimateMode}</option>
                <option value="flat-rate">{copy.flatRateMode}</option>
              </select>

              {#if estimateMode === 'finnish-2026'}
                <p
                  id="finnish-tax-help"
                  class="mt-2 text-xs text-slate-500 dark:text-slate-400"
                >
                  {copy.finnishEstimateAssumptions}
                  <a
                    class="font-medium text-indigo-700 underline dark:text-indigo-300"
                    href="https://www.vero.fi/en/individuals/tax-cards-and-tax-returns/income/earned-income/tax-rates-on-pay-pensions-and-benefits/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.veroExamples}
                  </a>
                  {' · '}
                  <a
                    class="font-medium text-indigo-700 underline dark:text-indigo-300"
                    href="https://www.vero.fi/en/individuals/tax-cards-and-tax-returns/tax_card/tax-percentage-calculator/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.veroCalculator}
                  </a>
                </p>
                {#if finnishEstimateOverLimit}
                  <p class={errorClass} role="alert">
                    {copy.finnishEstimateLimit}
                  </p>
                {/if}
              {:else}
                <div class="mt-4">
                  <label for="tax-rate" class={labelClass}>{copy.taxRate}</label
                  >
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
                </div>
              {/if}

              {#if showNetEstimate && finnishEstimate}
                <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <dt class="text-slate-500 dark:text-slate-400">
                      {copy.estimatedTaxYear}
                    </dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">
                      {formatEuro(finnishEstimate.annualTax, language)}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <dt class="text-slate-500 dark:text-slate-400">
                      {copy.estimatedContributionsYear}
                    </dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">
                      {formatEuro(
                        finnishEstimate.annualEmployeeContributions,
                        language,
                      )}
                    </dd>
                  </div>
                </dl>
              {/if}

              {#if showNetEstimate && netEstimate}
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

              {#if showReverseMode}
                <div
                  class="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"
                >
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="net-target" class={labelClass}>
                        {copy.netTargetLabel}
                      </label>
                      <input
                        id="net-target"
                        type="text"
                        inputmode="decimal"
                        bind:value={netTarget}
                        aria-invalid={Boolean(reverseTargetError)}
                        aria-describedby={reverseTargetError
                          ? 'reverse-target-error'
                          : undefined}
                        class={inputClass}
                      />
                    </div>
                    <div>
                      <label for="net-target-period" class={labelClass}>
                        {copy.targetPeriod}
                      </label>
                      <select
                        id="net-target-period"
                        bind:value={netTargetPeriod}
                        class={inputClass}
                      >
                        <option value="hourly">{copy.targetHourly}</option>
                        <option value="monthly">{copy.targetMonthly}</option>
                      </select>
                    </div>
                  </div>
                  {#if reverseTargetError}
                    <p
                      id="reverse-target-error"
                      class={errorClass}
                      role="alert"
                    >
                      {reverseTargetError}
                    </p>
                  {/if}
                  {#if reverseTargetUnavailable}
                    <p class={errorClass} role="alert">
                      {estimateMode === 'flat-rate' && taxRateValue === 100
                        ? copy.reverseFlatRateLimit
                        : estimateMode === 'finnish-2026'
                          ? copy.reverseTargetAboveLimit
                          : copy.reverseGrossLimit}
                    </p>
                  {/if}
                  {#if reverseTarget}
                    <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div
                        class="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/50"
                      >
                        <dt class="text-slate-600 dark:text-slate-300">
                          {copy.grossRequiredMonthly}
                        </dt>
                        <dd
                          class="font-semibold text-slate-900 dark:text-white"
                          data-testid="reverse-gross-monthly"
                        >
                          {formatEuro(reverseTarget.grossMonthly, language)}
                        </dd>
                      </div>
                      <div
                        class="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/50"
                      >
                        <dt class="text-slate-600 dark:text-slate-300">
                          {copy.grossRequiredHourly}
                        </dt>
                        <dd
                          class="font-semibold text-slate-900 dark:text-white"
                          data-testid="reverse-gross-hourly"
                        >
                          {formatEuro(reverseTarget.grossHourly, language)}
                        </dd>
                      </div>
                      <div
                        class="col-span-2 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/50"
                      >
                        <dt class="text-slate-600 dark:text-slate-300">
                          {copy.grossRequiredYearly}
                        </dt>
                        <dd
                          class="font-semibold text-slate-900 dark:text-white"
                          data-testid="reverse-gross-yearly"
                        >
                          {formatEuro(reverseTarget.grossYearly, language)}
                        </dd>
                      </div>
                    </dl>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </details>
      </div>

      <div>
        <details
          bind:open={yearlySectionOpen}
          data-testid="yearly-section"
          class="rounded-xl p-5 ring-1 ring-slate-200 dark:ring-slate-700"
        >
          <summary class="cursor-pointer select-none">
            <h2
              id="yearly-title"
              class="inline text-lg font-semibold text-slate-900 dark:text-white"
            >
              {copy.yearlyTitle}
            </h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {copy.yearlyDescription}
            </p>
          </summary>

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
        </details>

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
