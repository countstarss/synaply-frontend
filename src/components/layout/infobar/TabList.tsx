"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import {
  mainNavItems,
  personalNavItems,
  secondaryNavItems,
} from "@/lib/data/constant";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function TabList() {
  const pathname = usePathname();
  const { setActiveTab } = useSidebarStore();
  const { currentWorkspace } = useWorkspace();

  const tabItems =
    currentWorkspace?.type === "TEAM"
      ? [...mainNavItems, ...secondaryNavItems]
      : [...personalNavItems];

  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-left-5 duration-300">
      {tabItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setActiveTab(item.label)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "transition-all duration-200 hover:scale-105",
              "hover:bg-accent/80 hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              isActive
                ? "bg-primary/90 text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground bg-background/60 backdrop-blur-sm border border-border/30"
            )}
            title={item.label}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive && "scale-110"
              )}
            />
            <span className="hidden lg:inline whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
