"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { mainNavItems } from "@/lib/data/constant";

export default function TabList() {
  const pathname = usePathname();
  const { setActiveTab } = useSidebarStore();

  return (
    <div className="animate-in flex items-center gap-2 slide-in-from-left-5 duration-300">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setActiveTab(item.label)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              "transition-all duration-200 hover:scale-105",
              "hover:bg-accent/80 hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              isActive
                ? "bg-primary/90 text-primary-foreground shadow-md"
                : "border border-border/30 bg-background/60 text-muted-foreground backdrop-blur-sm hover:text-foreground",
            )}
            title={item.label}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive && "scale-110",
              )}
            />
            <span className="hidden whitespace-nowrap lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
