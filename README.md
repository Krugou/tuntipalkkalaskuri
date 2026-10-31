# Hourly Wage Calculator (tuntipalkkalaskuri)

A TypeScript, Svelte, and Tailwind CSS progressive web app that converts monthly
or yearly gross salary into hourly, weekly, and annual figures. It supports
English and Finnish, stores preferences in the browser, and can be installed
and used offline.

The optional net-pay view applies a user-selected flat effective tax rate. It
is an estimate only, not a Finnish tax calculation or tax advice. Calculator
inputs remain in local browser storage; the app has no backend or API.

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
