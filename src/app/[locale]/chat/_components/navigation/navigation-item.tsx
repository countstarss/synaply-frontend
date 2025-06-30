"use client";

import { cn } from "@/lib/utils";

interface NavigationItemProps {
  children: React.ReactNode;
}

export function NavigationItem({ children }: NavigationItemProps) {
  return (
    <div className={cn(
      "group relative flex items-center",
      "before:absolute before:left-0 before:w-[4px] before:h-[8px] before:rounded-r-full",
      "before:bg-primary before:transition-all before:opacity-0",
      "hover:before:h-[20px] hover:before:opacity-100"
    )}>
      {children}
    </div>
  );
}