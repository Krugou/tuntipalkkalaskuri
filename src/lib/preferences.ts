import type {
  HoursPeriod,
  Language,
  NetEstimateMode,
  NetTargetPeriod,
} from './calculator';

export const PREFERENCES_KEY = 'calculator-preferences';

export interface CalculatorPreferences {
  salary: string;
  hours: string;
  period: HoursPeriod;
  yearly: string;
  taxRate: string;
  showNetEstimate: boolean;
  estimateMode: NetEstimateMode;
  showReverseMode: boolean;
  netTarget: string;
  netTargetPeriod: NetTargetPeriod;
  hourlySectionOpen: boolean;
  netSectionOpen: boolean;
  yearlySectionOpen: boolean;
  language: Language;
}

export interface LoadedPreferences {
  preferences: CalculatorPreferences;
  storageAvailable: boolean;
}

const defaultPreferences: CalculatorPreferences = {
  salary: '2000',
  hours: '37.5',
  period: 'weekly',
  yearly: '24000',
  taxRate: '25',
  showNetEstimate: false,
  estimateMode: 'finnish-2026',
  showReverseMode: false,
  netTarget: '20',
  netTargetPeriod: 'hourly',
  hourlySectionOpen: true,
  netSectionOpen: true,
  yearlySectionOpen: true,
  language: 'en',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function loadPreferences(): LoadedPreferences {
  let stored: string | null;
  try {
    stored = localStorage.getItem(PREFERENCES_KEY);
  } catch {
    return { preferences: defaultPreferences, storageAvailable: false };
  }

  if (!stored) {
    const browserLanguage =
      typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
    return {
      preferences: {
        ...defaultPreferences,
        language: browserLanguage.startsWith('fi') ? 'fi' : 'en',
      },
      storageAvailable: true,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { preferences: defaultPreferences, storageAvailable: true };
  }

  if (!isRecord(parsed))
    return { preferences: defaultPreferences, storageAvailable: true };

  return {
    preferences: {
      salary:
        typeof parsed.salary === 'string'
          ? parsed.salary
          : defaultPreferences.salary,
      hours:
        typeof parsed.hours === 'string'
          ? parsed.hours
          : defaultPreferences.hours,
      period:
        parsed.period === 'weekly' || parsed.period === 'monthly'
          ? parsed.period
          : defaultPreferences.period,
      yearly:
        typeof parsed.yearly === 'string'
          ? parsed.yearly
          : defaultPreferences.yearly,
      taxRate:
        typeof parsed.taxRate === 'string'
          ? parsed.taxRate
          : defaultPreferences.taxRate,
      showNetEstimate:
        typeof parsed.showNetEstimate === 'boolean'
          ? parsed.showNetEstimate
          : defaultPreferences.showNetEstimate,
      estimateMode:
        parsed.estimateMode === 'flat-rate'
          ? 'flat-rate'
          : defaultPreferences.estimateMode,
      showReverseMode:
        typeof parsed.showReverseMode === 'boolean'
          ? parsed.showReverseMode
          : defaultPreferences.showReverseMode,
      netTarget:
        typeof parsed.netTarget === 'string'
          ? parsed.netTarget
          : defaultPreferences.netTarget,
      netTargetPeriod:
        parsed.netTargetPeriod === 'hourly' ||
        parsed.netTargetPeriod === 'monthly'
          ? parsed.netTargetPeriod
          : defaultPreferences.netTargetPeriod,
      hourlySectionOpen:
        typeof parsed.hourlySectionOpen === 'boolean'
          ? parsed.hourlySectionOpen
          : defaultPreferences.hourlySectionOpen,
      netSectionOpen:
        typeof parsed.netSectionOpen === 'boolean'
          ? parsed.netSectionOpen
          : defaultPreferences.netSectionOpen,
      yearlySectionOpen:
        typeof parsed.yearlySectionOpen === 'boolean'
          ? parsed.yearlySectionOpen
          : defaultPreferences.yearlySectionOpen,
      language: parsed.language === 'fi' ? 'fi' : 'en',
    },
    storageAvailable: true,
  };
}

export function savePreferences(preferences: CalculatorPreferences): boolean {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
