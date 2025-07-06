import React from "react";
import { ThemeProvider } from "./theme-provider";
import { ConvexClientProvider } from "./convex-provider";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { LocalDbProvider } from "./local-db-provider"; // 导入 LocalDbProvider
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
      <ConvexClientProvider>
        <NextIntlClientProvider>
          <LocalDbProvider>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </LocalDbProvider>
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
