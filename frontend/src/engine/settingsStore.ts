/**
 * Global app settings for the child experience — persisted in localStorage.
 * Language is chosen ONCE in Settings (menu), not on every game screen.
 */

import React from 'react';

export type KidLang = 'en' | 'hi';

interface KidSettings {
  lang: KidLang;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'ai_learning_adventure_settings_v1';

const DEFAULTS: KidSettings = { lang: 'en', soundEnabled: true };

function load(): KidSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<KidSettings>;
    return {
      lang: parsed.lang === 'hi' ? 'hi' : 'en',
      soundEnabled: parsed.soundEnabled !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let settings: KidSettings = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable — settings just won't persist
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

export const settingsStore = {
  get(): KidSettings {
    return { ...settings };
  },
  getLang(): KidLang {
    return settings.lang;
  },
  setLang(lang: KidLang): void {
    if (settings.lang === lang) return;
    settings.lang = lang;
    persist();
    notify();
  },
  isSoundEnabled(): boolean {
    return settings.soundEnabled;
  },
  setSoundEnabled(enabled: boolean): void {
    settings.soundEnabled = enabled;
    persist();
    notify();
  },
  /** Subscribe to any settings change; returns an unsubscribe function. */
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** React hook that re-renders when settings change. */
export function useKidSettings(): KidSettings {
  const [, setTick] = React.useState(0);
  React.useEffect(() => settingsStore.subscribe(() => setTick((t) => t + 1)), []);
  return settingsStore.get();
}