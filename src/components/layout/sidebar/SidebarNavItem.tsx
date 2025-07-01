"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  className?: string;
}

const SidebarNavItem = ({
  icon: Icon,
  label,
  href,
  isActive,
  className,
}: SidebarNavItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 mx-2 rounded-md cursor-pointer transition-colors",
          "text-gray-600 hover:bg-[#2b2b2b] hover:text-white",
          "dark:text-gray-300 dark:hover:text-white",
          isActive && "text-white dark:text-gray-300 bg-[#4b4b4bb7]",
          className
        )}
      >
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
};

export default SidebarNavItem;
