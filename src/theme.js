export const THEME_STORAGE_KEY = 'squadr_theme';

export const THEMES = {
  light: 'light',
  dark: 'dark',
};

export function getStoredTheme() {
  if (typeof window === 'undefined') return THEMES.light;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === THEMES.dark || stored === THEMES.light) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? THEMES.dark
    : THEMES.light;
}

export function applyTheme(theme) {
  const next = theme === THEMES.dark ? THEMES.dark : THEMES.light;
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  localStorage.setItem(THEME_STORAGE_KEY, next);
  return next;
}

export function initTheme() {
  return applyTheme(getStoredTheme());
}
