import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  });

  it('converts a yearly salary', async () => {
    const user = userEvent.setup();
    render(App);
    expect(screen.getByTestId('yearly-monthly')).toHaveTextContent('€2,000.00');
    const yearly = screen.getByLabelText(/yearly salary/i);
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
    expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument();
  });
});
