import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from './App.svelte';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  document.documentElement.classList.remove('dark');
});

describe('App', () => {
  it('defaults to 37.5 weekly hours', () => {
    render(App);
    expect(screen.getByLabelText(/hours per week/i)).toHaveValue('37.5');
    expect(screen.getByLabelText(/monthly salary/i)).toHaveValue('2000');
  });

  it('shows the hourly wage for the defaults', () => {
    render(App);
    expect(screen.getByTestId('hourly')).toHaveTextContent('€12.31');
  });

  it('recalculates when salary changes', async () => {
    const user = userEvent.setup();
    render(App);
    const salary = screen.getByLabelText(/monthly salary/i);
    await user.clear(salary);
    await user.type(salary, '3000');
    expect(screen.getByTestId('hourly')).toHaveTextContent('€18.46');
  });

  it('accepts a comma as decimal separator', async () => {
    const user = userEvent.setup();
    render(App);
    const hours = screen.getByLabelText(/hours per week/i);
    await user.clear(hours);
    await user.type(hours, '37,5');
    expect(screen.getByTestId('hourly')).toHaveTextContent('€12.31');
  });

  it('switches to monthly hours', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByLabelText('Per month'));
    const hours = screen.getByLabelText(/hours per month/i);
    await user.clear(hours);
    await user.type(hours, '160');
    expect(screen.getByTestId('hourly')).toHaveTextContent('€12.50');
  });

  it('shows a hint instead of a result for invalid input', async () => {
    const user = userEvent.setup();
    render(App);
    await user.clear(screen.getByLabelText(/monthly salary/i));
    expect(screen.queryByTestId('hourly')).not.toBeInTheDocument();
    expect(screen.getByText(/enter a monthly salary/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  });

  it('rejects invalid numbers and displays inline guidance', async () => {
    const user = userEvent.setup();
    render(App);
    const hours = screen.getByLabelText(/hours per week/i);
    await user.clear(hours);
    await user.type(hours, '-4');
    expect(screen.queryByTestId('hourly')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/greater than zero/i);
    expect(hours).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts a Finnish decimal separator for salary', async () => {
    const user = userEvent.setup();
    render(App);
    const salary = screen.getByLabelText(/monthly salary/i);
    await user.clear(salary);
    await user.type(salary, '2500,50');
    expect(screen.getByTestId('hourly')).toHaveTextContent('€15.39');
  });

  it('switches to Finnish and formats euros for the Finnish locale', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(
      screen.getByRole('heading', { name: 'Tuntipalkkalaskuri' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hourly')).toHaveTextContent('12,31');
    expect(document.documentElement).toHaveAttribute('lang', 'fi');
  });

  it('persists calculator preferences', async () => {
    const user = userEvent.setup();
    render(App);
    await user.clear(screen.getByLabelText(/monthly salary/i));
    await user.type(screen.getByLabelText(/monthly salary/i), '3500');
    const stored = JSON.parse(
      localStorage.getItem('calculator-preferences') ?? '{}',
    );
    expect(stored.salary).toBe('3500');
    expect(stored.period).toBe('weekly');
    expect(stored.estimateMode).toBe('finnish-2026');
  });

  it('estimates Finnish 2026 net pay from annualized monthly salary', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByLabelText(/show an estimated net pay/i));
    expect(screen.getByLabelText(/estimate method/i)).toHaveValue(
      'finnish-2026',
    );
    expect(screen.getByText('€1,179.30')).toBeInTheDocument();
    expect(screen.getByText('€1,965.60')).toBeInTheDocument();
    expect(screen.getByText('€1,737.93')).toBeInTheDocument();
    expect(
      screen.getByText(/interpolated from the Finnish Tax Administration/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /vero.fi 2026 tax examples/i }),
    ).toHaveAttribute('href', expect.stringContaining('vero.fi'));
  });

  it('calculates gross pay needed for an hourly Finnish net target', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(
      screen.getByLabelText(/find the gross salary needed for a net target/i),
    );
    expect(screen.getByLabelText(/target take-home pay/i)).toHaveValue('20');
    expect(screen.getByLabelText(/target period/i)).toHaveValue('hourly');
    expect(screen.getByTestId('reverse-gross-hourly')).toHaveTextContent(
      /€\s?28[,.]0\d/,
    );
    expect(screen.getByTestId('reverse-gross-monthly').textContent).toMatch(
      /€\s?4[,.]5\d{2}/,
    );
  });

  it('calculates gross pay needed for a monthly net target', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(
      screen.getByLabelText(/find the gross salary needed for a net target/i),
    );
    await user.clear(screen.getByLabelText(/target take-home pay/i));
    await user.type(screen.getByLabelText(/target take-home pay/i), '3500');
    await user.selectOptions(
      screen.getByLabelText(/target period/i),
      'monthly',
    );
    expect(screen.getByTestId('reverse-gross-monthly')).toHaveTextContent(
      /€\s?5[,.]\d{3}/,
    );
    expect(screen.getByTestId('reverse-gross-yearly')).toHaveTextContent(
      /€\s?\d{2},\d{3}/,
    );
  });

  it('keeps reverse flat-rate mode usable without enabling the forward estimate', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(
      screen.getByLabelText(/find the gross salary needed for a net target/i),
    );
    await user.selectOptions(
      screen.getByLabelText(/estimate method/i),
      'flat-rate',
    );
    await user.clear(screen.getByLabelText(/estimated effective tax rate/i));
    await user.type(
      screen.getByLabelText(/estimated effective tax rate/i),
      '25',
    );
    expect(screen.getByTestId('reverse-gross-hourly')).toHaveTextContent(
      /€\s?26[,.]67/,
    );
  });

  it('links to the official calculator when Finnish examples do not cover the income', async () => {
    const user = userEvent.setup();
    render(App);
    await user.clear(screen.getByLabelText(/monthly salary/i));
    await user.type(screen.getByLabelText(/monthly salary/i), '6000');
    await user.click(screen.getByLabelText(/show an estimated net pay/i));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /annual salaries up to €70,000/i,
    );
    expect(
      screen.getByRole('link', { name: /official tax calculator/i }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('tax-percentage-calculator'),
    );
    expect(screen.queryByText('€1,737.93')).not.toBeInTheDocument();
  });

  it('estimates net pay with a user-selected flat tax rate', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByLabelText(/show an estimated net pay/i));
    await user.selectOptions(
      screen.getByLabelText(/estimate method/i),
      'flat-rate',
    );
    expect(screen.getByLabelText(/effective tax rate/i)).toHaveValue('25');
    expect(screen.getByText('€1,500.00')).toBeInTheDocument();
    expect(screen.getByText('€9.23')).toBeInTheDocument();
    expect(
      screen.getByText(/not a Finnish tax calculation/i),
    ).toBeInTheDocument();
  });

  it('validates the estimated tax rate', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByLabelText(/show an estimated net pay/i));
    await user.selectOptions(
      screen.getByLabelText(/estimate method/i),
      'flat-rate',
    );
    const taxRate = screen.getByLabelText(/effective tax rate/i);
    await user.clear(taxRate);
    await user.type(taxRate, '101');
    expect(screen.getByRole('alert')).toHaveTextContent(/from 0 to 100/i);
    expect(screen.queryByText('€1,500.00')).not.toBeInTheDocument();
  });

  it('copies the result when native sharing is unavailable', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    render(App);
    await user.click(
      screen.getByRole('button', { name: /share \/ copy result/i }),
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('€12.31'));
    expect(screen.getByRole('status')).toHaveTextContent(/shared or copied/i);
  });

  it('converts a yearly salary', async () => {
    const user = userEvent.setup();
    render(App);
    expect(screen.getByTestId('yearly-monthly')).toHaveTextContent('€2,000.00');
    const yearly = screen.getByLabelText('Yearly salary (gross)');
    await user.clear(yearly);
    await user.type(yearly, '36000');
    expect(screen.getByTestId('yearly-monthly')).toHaveTextContent('€3,000.00');
    expect(screen.getByTestId('yearly-hourly')).toHaveTextContent('€18.46');
  });

  it('toggles dark mode and persists the choice', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('button', { name: /dark mode/i }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: /light mode/i }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('reflects an already-dark document on load', () => {
    document.documentElement.classList.add('dark');
    render(App);
    expect(
      screen.getByRole('button', { name: /light mode/i }),
    ).toBeInTheDocument();
  });
});
