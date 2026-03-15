"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  return (
    <div className={cn("px-4 pb-3 pt-4", className)}>
      <div className="rounded-lg border border-app-border bg-app-content-bg p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">TuneAdmin Template</p>
            <p className="text-xs text-muted-foreground">Marketplace-ready UI starter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarBrand;
