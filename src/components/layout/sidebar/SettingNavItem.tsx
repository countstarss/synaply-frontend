"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface SettingNavItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  action?: () => void;
  isActive?: boolean;
  className?: string;
}

const SettingNavItem = React.memo(
  ({
    icon: Icon,
    label,
    href,
    action,
    isActive = false,
    className,
  }: SettingNavItemProps) => {
    const baseClasses = cn(
      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
      "hover:bg-app-button-hover",
      isActive && "bg-app-button-hover",
      className
    );

    const content = (
      <>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </>
    );

    if (href) {
      return (
        <Link href={href} className={baseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={action} className={baseClasses}>
        {content}
      </button>
    );
  }
);

SettingNavItem.displayName = "SettingNavItem";

export default SettingNavItem;
