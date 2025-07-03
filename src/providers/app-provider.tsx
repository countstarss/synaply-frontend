import React from "react";
import { ThemeProvider } from "./theme-provider";
import { ConvexClientProvider } from "./convex-provider";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { LocalDbProvider } from "./local-db-provider"; // 导入 LocalDbProvider

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
          <LocalDbProvider> {/* 添加 LocalDbProvider */}
            <AuthProvider>{children}</AuthProvider>
          </LocalDbProvider>
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
