"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn, isRouteActive } from "@/lib/utils";
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
  const pathname = usePathname();
  const active = isActive ?? isRouteActive(pathname, href);

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 mx-2 rounded-md cursor-pointer transition-colors",
          "text-gray-600 hover:bg-[#2b2b2b] hover:text-white",
          "dark:text-gray-300 dark:hover:text-white",
          active && "text-white dark:text-gray-300 bg-[#2b2b2b]",
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
