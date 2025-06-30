import React from 'react';
import { ThemeProvider } from './theme-provider';
import { ConvexClientProvider } from './convex-provider';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/context/AuthContext';

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="synaply-theme"
    >
      <ConvexClientProvider>
        <NextIntlClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;