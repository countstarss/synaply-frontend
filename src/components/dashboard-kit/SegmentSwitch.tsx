import { cn } from "@/lib/utils";

export interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentSwitchProps {
  value: string;
  options: SegmentOption[];
  onChange: (value: string) => void;
}

export function SegmentSwitch({ value, options, onChange }: SegmentSwitchProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-app-border bg-app-content-bg p-1">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-app-bg hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
