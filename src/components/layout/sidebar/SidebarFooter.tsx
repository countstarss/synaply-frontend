"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  className?: string;
}

const SidebarFooter = ({ className }: SidebarFooterProps) => {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col items-center px-4 py-6 text-center",
        className,
      )}
    >
      <h3 className="text-sm font-semibold">UI Template Starter</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Built for rapid business customization.
      </p>
    </div>
  );
};

export default SidebarFooter;
