import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  context: 'family' | 'serve';
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface PathWayThemeProviderProps {
  children: ReactNode;
  context: 'family' | 'serve';
}

export function PathWayThemeProvider({ children, context }: PathWayThemeProviderProps) {
  const themeConfig = {
    family: {
      primary: '#76D7C4', // mint
      accent: '#FFD166',  // yellow
      background: '#F5F5F5',
      surface: '#FFFFFF',
      text: '#333333'
    },
    serve: {
      primary: '#76D7C4', // mint
      accent: '#4DA9E5',  // blue  
      background: '#F5F5F5',
      surface: '#FFFFFF',
      text: '#333333'
    }
  };

  const themeValue: ThemeContextType = {
    context,
    colors: themeConfig[context]
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <div 
        className="min-h-screen transition-colors duration-300"
        style={{
          '--theme-primary': themeValue.colors.primary,
          '--theme-accent': themeValue.colors.accent,
          '--theme-background': themeValue.colors.background,
          '--theme-surface': themeValue.colors.surface,
          '--theme-text': themeValue.colors.text,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function usePathWayTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('usePathWayTheme must be used within a PathWayThemeProvider');
  }
  return context;
}