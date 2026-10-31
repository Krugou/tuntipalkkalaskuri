# Hourly Wage Calculator (tuntipalkkalaskuri)

A TypeScript, Svelte, and Tailwind CSS progressive web app that converts monthly
or yearly gross salary into hourly, weekly, and annual figures. It supports
English and Finnish, stores preferences in the browser, and can be installed
and used offline.

The optional net-pay view includes a Finnish 2026 estimate based on annualized
monthly gross salary and the Finnish Tax Administration's published Helsinki
examples, plus an alternative custom flat-rate estimate. The Finnish estimate
interpolates between published examples and assumes their stated profile; it is
not an exact tax-card calculation or tax advice. See
[Vero's 2026 tax examples](https://www.vero.fi/en/individuals/tax-cards-and-tax-returns/income/earned-income/tax-rates-on-pay-pensions-and-benefits/)
and use
[Vero's calculator](https://www.vero.fi/en/individuals/tax-cards-and-tax-returns/tax_card/tax-percentage-calculator/)
for a personal estimate. Calculator inputs remain in local browser storage;
the app has no backend or API.

Enable reverse mode to estimate the gross monthly salary needed to reach a
take-home target per hour or month. It uses the same tax method and working
hours as the net-pay estimate; the Finnish estimate is available only within
the published example range.

The hourly results, net-pay tools, and yearly salary panels can each be
collapsed independently. Their open/closed state is saved with the other
calculator preferences in the browser.

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run check
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Prettier can format the repository with `npm run format`.

## Deployment

Pushes to `main` build the site and deploy it to GitHub Pages through
`.github/workflows/deploy.yml`. In the repository settings, set
**Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
The workflow runs type, lint, formatting, unit, and Playwright E2E checks before
building and deploying the site.
