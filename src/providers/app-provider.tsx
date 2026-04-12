import React from "react";
import { ThemeProvider } from "./theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "./query-provider"; // 导入 QueryProvider

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
      storageKey="synaply-theme"
    >
      <NextIntlClientProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
