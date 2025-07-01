"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-3", className)}>
      <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
        <span className="text-black font-bold text-sm">I</span>
      </div>
      <span className="font-semibold text-lg">InsightLab</span>
    </div>
  );
};

export default SidebarBrand;
