import { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'green' | 'blue' | 'red' | 'gray';

const ThemeContext = createContext<{
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
}>({ theme: 'green', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('capp-theme') as AppTheme) ?? 'green';
  });

  function setTheme(t: AppTheme) {
    setThemeState(t);
    localStorage.setItem('capp-theme', t);
  }

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'green') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
