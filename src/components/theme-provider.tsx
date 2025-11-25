'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ai-lawyer-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => {
      // Only access localStorage in the browser
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        return stored ? (stored as Theme) : defaultTheme;
      }
      return defaultTheme;
    }
  );

  // Apply theme changes
  React.useEffect(() => {
    const root = window.document.documentElement;
    
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.type = 'text/css';
      css.appendChild(
        document.createTextNode(
          `* {
             transition: none !important;
           }`
        )
      );
      document.head.appendChild(css);
      
      // Force a reflow, flushing the CSS changes
      (() => window.getComputedStyle(document.body))();
    }

    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else if (theme) {
      root.classList.add(theme);
    }

    // Set the data-theme attribute
    root.setAttribute(attribute, theme);

    if (disableTransitionOnChange) {
      // Remove the transition override after the next frame
      const timeoutId = setTimeout(() => {
        const styles = document.querySelectorAll('style[data-theme-transition]');
        styles.forEach((style) => style.remove());
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newTheme);
        }
        setTheme(newTheme);
      },
    }),
    [theme, storageKey]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
