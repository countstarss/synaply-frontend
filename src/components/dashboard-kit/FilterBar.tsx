import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import React from "react";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  timeframeValue: string;
  timeframeOptions: FilterOption[];
  onTimeframeChange: (value: string) => void;
  children?: React.ReactNode;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  timeframeValue,
  timeframeOptions,
  onTimeframeChange,
  children,
}: FilterBarProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-content-bg p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search records, owners, or timeline..."
              className="pl-9"
            />
          </div>

          <Select value={timeframeValue} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </div>
    </section>
  );
}
