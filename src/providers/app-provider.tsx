import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="template-ui-theme"
    >
      <NextIntlClientProvider>
        <AuthProvider>{children}</AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
