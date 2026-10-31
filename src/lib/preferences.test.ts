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
      showReverseMode: true,
      netTarget: '20',
      netTargetPeriod: 'hourly' as const,
      hourlySectionOpen: false,
      netSectionOpen: true,
      yearlySectionOpen: false,
      wideLayout: true,
      language: 'fi' as const,
    };

    expect(savePreferences(preferences)).toBe(true);
    expect(loadPreferences()).toEqual({ preferences, storageAvailable: true });
  });

  it('ignores malformed and unsupported saved values', () => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        salary: 3200,
        period: 'yearly',
        netTargetPeriod: 'yearly',
        estimateMode: 'invalid',
      }),
    );
    const loaded = loadPreferences();
    expect(loaded.storageAvailable).toBe(true);
    expect(loaded.preferences.salary).toBe('2000');
    expect(loaded.preferences.period).toBe('weekly');
    expect(loaded.preferences.estimateMode).toBe('finnish-2026');
    expect(loaded.preferences.netTargetPeriod).toBe('hourly');
    expect(loaded.preferences.hourlySectionOpen).toBe(true);
    expect(loaded.preferences.netSectionOpen).toBe(true);
    expect(loaded.preferences.yearlySectionOpen).toBe(true);
    expect(loaded.preferences.wideLayout).toBe(false);
  });

  it('falls back safely when stored JSON is malformed', () => {
    localStorage.setItem(PREFERENCES_KEY, '{bad json');
    const loaded = loadPreferences();
    expect(loaded.storageAvailable).toBe(true);
    expect(loaded.preferences.salary).toBe('2000');
  });
});
