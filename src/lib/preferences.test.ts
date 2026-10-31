import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
} from './preferences';

beforeEach(() => localStorage.clear());

describe('calculator preferences', () => {
  it('saves and restores all user settings', () => {
    const preferences = {
      salary: '3200',
      hours: '36',
      period: 'weekly' as const,
      yearly: '38400',
      taxRate: '27',
      showNetEstimate: true,
      estimateMode: 'flat-rate' as const,
      language: 'fi' as const,
    };

    expect(savePreferences(preferences)).toBe(true);
    expect(loadPreferences()).toEqual({ preferences, storageAvailable: true });
  });

  it('ignores malformed and unsupported saved values', () => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ salary: 3200, period: 'yearly' }),
    );
    const loaded = loadPreferences();
    expect(loaded.storageAvailable).toBe(true);
    expect(loaded.preferences.salary).toBe('2000');
    expect(loaded.preferences.period).toBe('weekly');
  });

  it('falls back safely when stored JSON is malformed', () => {
    localStorage.setItem(PREFERENCES_KEY, '{bad json');
    const loaded = loadPreferences();
    expect(loaded.storageAvailable).toBe(true);
    expect(loaded.preferences.salary).toBe('2000');
  });
});
