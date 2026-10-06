import { track } from '@vercel/analytics';

// Anonymous product analytics only. Never called with user code.
const ALLOWED = new Set([
  'playground_opened',
  'example_selected',
  'code_executed',
  'learn_mode_activated',
  'visualizer_tab_used',
  'language_changed',
]);

export function trackEvent(name: string) {
  if (!ALLOWED.has(name)) return;
  try {
    track(name);
  } catch {
    /* analytics not configured */
  }
}
