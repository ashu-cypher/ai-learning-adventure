import { sound } from './soundEngine';
import { settingsStore } from '../engine/settingsStore';

/**
 * Speak to the child in the globally chosen language (Settings > Language).
 * Pass both English and Hindi text; the setting decides which is spoken.
 * If Hindi text is missing, English is used as a fallback.
 */
export function speakKid(
  textEn: string,
  textHi?: string,
  onEnd?: () => void
): void {
  const lang = settingsStore.getLang();
  const text = lang === 'hi' && textHi ? textHi : textEn;
  sound.speak(text, lang, onEnd);
}

/** Current global kid language. */
export function getKidLang(): 'en' | 'hi' {
  return settingsStore.getLang();
}

/**
 * Small helper for "Milo says" teaching lines with per-language variants.
 */
export function miloSay(lines: { en: string; hi?: string }, onEnd?: () => void): void {
  speakKid(lines.en, lines.hi, onEnd);
}
