"use client";

import React, { useState } from "react";
import { Menu, PanelLeft, PanelRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { useSidebarStore } from "@/stores/sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import TabList from "../infobar/TabList";
import { mainNavItems } from "@/lib/data/constant";

interface InfoBarProps {
  showViewToggle?: boolean;
  className?: string;
}

const InfoBar = ({ className }: InfoBarProps) => {
  const [open, setOpen] = useState(false);
  const { isOpen, toggleSidebar } = useSidebarStore();

  return (
    <ContextMenuWrapper>
      <div className={cn("flex w-full flex-col bg-app-bg", className)}>
        <div className="relative flex min-h-[56px] flex-row items-center justify-between gap-6 p-2">
          <div className="flex min-w-0 flex-1 flex-row items-center gap-3">
            <button
              onClick={toggleSidebar}
              className={cn(
                "group hidden h-9 w-9 items-center justify-center rounded-lg pl-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground md:flex",
              )}
              title={isOpen ? "Hide sidebar" : "Show sidebar"}
              type="button"
            >
              {isOpen ? (
                <PanelLeft className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-180" />
              ) : (
                <PanelRight className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-180" />
              )}
            </button>

            <div
              className={cn(
                "hidden transition-all duration-300 md:block",
                isOpen ? "w-0 overflow-hidden opacity-0" : "opacity-100",
              )}
            >
              <TabList />
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button type="button" className="text-foreground">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-1/2 border-app-border bg-app-bg">
                  <DialogTitle className="sr-only">Menu</DialogTitle>
                  <div className="flex flex-col gap-4 p-4">
                    {mainNavItems.map((menuItem) => (
                      <Link
                        href={menuItem.href}
                        key={menuItem.label}
                        onClick={() => setOpen(false)}
                        className="text-lg text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {menuItem.label}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </ContextMenuWrapper>
  );
};

export default InfoBar;
