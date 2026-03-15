"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  const initials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || "A";
    return source.slice(0, 1).toUpperCase();
  }, [user?.email, user?.name]);

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <div className={cn("space-y-3 px-4 pb-3 pt-4", className)}>

      <div className="rounded-lg border border-app-border bg-app-content-bg p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {isAuthenticated
                  ? user?.name || "No name set"
                  : isLoading
                    ? "Loading user..."
                    : "Guest"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isAuthenticated ? user?.email : "Please sign in"}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-2 text-xs"
              onClick={() => router.push("/auth")}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarBrand;
