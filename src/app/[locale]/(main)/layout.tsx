"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import { GlobalPageCache } from "@/components/cache/GlobalPageCache";

interface LayoutProps {
  children: React.ReactNode;
}

const isCachedPage = (pathname: string) => {
  return (
    pathname.includes("/dashboard") ||
    pathname.includes("/teachers") ||
    pathname.includes("/profiles") ||
    pathname.includes("/bookings") ||
    pathname.includes("/operations") ||
    pathname.includes("/audit-logs")
  );
};

const Layout = ({ children }: LayoutProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const pathname = usePathname();
  const showCachedPage = isCachedPage(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64 opacity-100" : "w-0 overflow-hidden opacity-0",
        )}
      >
        <Sidebar />
      </div>

      <div
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden",
          sidebarOpen ? "ml-2" : "ml-0",
        )}
      >
        <Infobar />

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              showCachedPage
                ? "pointer-events-none translate-x-full opacity-0"
                : "pointer-events-auto translate-x-0 opacity-100",
            )}
          >
            <main className="mx-2 mb-2 h-[calc(100vh-64px)] rounded-lg border border-app-border bg-app-content-bg">
              <div className="h-full flex-1 overflow-y-auto rounded-lg bg-app-content-bg">
                {children}
              </div>
            </main>
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              showCachedPage
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-full opacity-0",
            )}
          >
            <div className="flex h-full flex-col">
              <div className="mx-2 mb-2 h-[calc(100vh-64px)] overflow-hidden rounded-lg border border-app-border bg-app-content-bg">
                <GlobalPageCache />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
