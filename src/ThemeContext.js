import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applyTheme, getStoredTheme, THEMES } from './theme';

const ThemeContext = createContext(null);

export { ThemeContext };

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === THEMES.dark ? THEMES.dark : THEMES.light);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) =>
      current === THEMES.dark ? THEMES.light : THEMES.dark
    );
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === THEMES.dark,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
