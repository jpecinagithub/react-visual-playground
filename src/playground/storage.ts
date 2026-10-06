export type Lang = 'es' | 'en';

export interface Prefs {
  exampleId: string;
  codeByExample: Record<string, string>;
  lang: Lang;
  theme: 'dark' | 'light';
  fontSize: number;
  live: boolean;
  highlight: boolean;
  panels: [number, number, number];
}

const KEY = 'rvp-prefs-v1';

export function loadPrefs(): Partial<Prefs> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
  }
}

export function savePrefs(p: Partial<Prefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...p }));
  } catch {
    /* storage unavailable */
  }
}
