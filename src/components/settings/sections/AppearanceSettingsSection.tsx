"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GLOW_MODES,
  GLOW_PRESETS,
  useAppearanceStore,
  type GlowMode,
  type GlowPreset,
} from "@/stores/appearance";
import AmbientGlow from "@/components/global/AmbientGlow";
import { Button } from "@/components/ui/button";

function getModePreviewBackground(
  mode: GlowMode,
  colors: GlowPreset["colors"],
) {
  const [a, b, c] = colors;

  if (mode === "aurora") {
    return [
      `linear-gradient(115deg, transparent 0%, ${a}40 22%, ${b}4d 42%, transparent 66%)`,
      `linear-gradient(74deg, transparent 8%, ${c}38 30%, transparent 62%)`,
      `radial-gradient(circle at 50% 18%, ${a}33, transparent 46%)`,
    ].join(", ");
  }

  if (mode === "ribbon") {
    return [
      `linear-gradient(145deg, transparent 4%, ${b}40 28%, transparent 58%)`,
      `linear-gradient(28deg, transparent 16%, ${a}47 46%, transparent 76%)`,
      `radial-gradient(circle at 20% 72%, ${c}38, transparent 44%)`,
    ].join(", ");
  }

  if (mode === "prism") {
    return [
      `linear-gradient(134deg, transparent 8%, ${a}26 26%, transparent 42%)`,
      `linear-gradient(146deg, transparent 18%, ${b}3a 42%, transparent 62%)`,
      `linear-gradient(158deg, transparent 28%, ${c}30 58%, transparent 76%)`,
      `radial-gradient(circle at 76% 20%, ${a}1e, transparent 26%)`,
    ].join(", ");
  }

  if (mode === "pulse") {
    return [
      `radial-gradient(circle at 50% 56%, ${a}32 0%, transparent 18%)`,
      `radial-gradient(circle at 50% 56%, transparent 20%, ${b}2a 32%, transparent 44%)`,
      `radial-gradient(circle at 50% 56%, transparent 38%, ${c}22 52%, transparent 66%)`,
      `radial-gradient(circle at 50% 56%, ${a}16, transparent 74%)`,
    ].join(", ");
  }

  if (mode === "corona") {
    return [
      `radial-gradient(circle at 50% 48%, transparent 26%, ${a}2c 34%, transparent 48%)`,
      `radial-gradient(circle at 50% 48%, ${b}20, transparent 62%)`,
      `radial-gradient(circle at 14% 14%, ${c}20, transparent 28%)`,
      `radial-gradient(circle at 86% 18%, ${a}1c, transparent 30%)`,
    ].join(", ");
  }

  return [
    `radial-gradient(circle at 92% 55%, ${a}33, transparent 55%)`,
    `radial-gradient(circle at 19% 75%, ${b}33, transparent 55%)`,
    `radial-gradient(circle at 24% 11%, ${a}33, transparent 55%)`,
    `radial-gradient(circle at 38% 97%, ${c}33, transparent 55%)`,
  ].join(", ");
}

function PresetSwatch({
  preset,
  selected,
  onSelect,
}: {
  preset: GlowPreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const [a, b, c] = preset.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-app-text-primary/40 bg-app-button-hover"
          : "border-app-border bg-app-bg/40 hover:bg-app-button-hover/60",
      )}
    >
      <div
        className="h-14 w-full overflow-hidden rounded-md"
        style={{
          backgroundImage: [
            `radial-gradient(circle at 92% 55%, ${a}33, transparent 55%)`,
            `radial-gradient(circle at 19% 75%, ${b}33, transparent 55%)`,
            `radial-gradient(circle at 24% 11%, ${a}33, transparent 55%)`,
            `radial-gradient(circle at 38% 97%, ${c}33, transparent 55%)`,
          ].join(", "),
          backgroundColor: "#0b1220",
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {preset.label}
        </span>
        {selected && <Check className="size-4 text-foreground" />}
      </div>
    </button>
  );
}

function ModeOption({
  mode,
  colors,
  selected,
  onSelect,
}: {
  mode: (typeof GLOW_MODES)[number];
  colors: GlowPreset["colors"];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "h-auto w-full flex-col items-stretch justify-start gap-3 rounded-lg p-3 text-left",
        selected
          ? "border-app-text-primary/40 bg-app-button-hover"
          : "border-app-border bg-app-bg/40 hover:bg-app-button-hover/60",
      )}
    >
      <span
        className="h-14 w-full overflow-hidden rounded-md"
        style={{
          backgroundImage: getModePreviewBackground(mode.id, colors),
          backgroundColor: "#0b1220",
        }}
      />
      <span className="flex flex-col gap-1 whitespace-normal">
        <span className="text-sm font-medium text-foreground">
          {mode.label}
        </span>
        <span className="text-xs leading-5 text-muted-foreground">
          {mode.description}
        </span>
      </span>
    </Button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-app-border bg-app-bg/30 px-4 py-3 text-left transition-colors hover:bg-app-button-hover/60"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </div>
      </div>
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-sky-400/60 bg-sky-500/60"
            : "border-app-border bg-app-bg/70",
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export default function AppearanceSettingsSection() {
  const tSettings = useTranslations("settings");
  const enabled = useAppearanceStore((s) => s.enabled);
  const animated = useAppearanceStore((s) => s.animated);
  const presetId = useAppearanceStore((s) => s.presetId);
  const mode = useAppearanceStore((s) => s.mode);
  const intensity = useAppearanceStore((s) => s.intensity);
  const setEnabled = useAppearanceStore((s) => s.setEnabled);
  const setAnimated = useAppearanceStore((s) => s.setAnimated);
  const setPresetId = useAppearanceStore((s) => s.setPresetId);
  const setMode = useAppearanceStore((s) => s.setMode);
  const setIntensity = useAppearanceStore((s) => s.setIntensity);
  const selectedPreset =
    GLOW_PRESETS.find((preset) => preset.id === presetId) ?? GLOW_PRESETS[0];

  return (
    <div className="space-y-6 py-1">
      <div className="flex items-start gap-4">
        <div className="border border-app-border bg-app-bg/40 p-3 text-muted-foreground">
          <Sparkles className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-foreground">
            {tSettings("appearance.title")}
          </div>
          <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {tSettings("appearance.description")}
          </div>
        </div>
      </div>

      <div className="relative h-40 overflow-hidden rounded-lg border border-app-border bg-app-bg">
        <AmbientGlow />
        <div className="relative z-10 flex h-full items-end p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {tSettings("appearance.preview")}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {tSettings("appearance.modeLabel")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {GLOW_MODES.map((modeOption) => (
            <ModeOption
              key={modeOption.id}
              mode={modeOption}
              colors={selectedPreset.colors}
              selected={modeOption.id === mode}
              onSelect={() => setMode(modeOption.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {tSettings("appearance.presetLabel")}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GLOW_PRESETS.map((preset) => (
            <PresetSwatch
              key={preset.id}
              preset={preset}
              selected={preset.id === presetId}
              onSelect={() => setPresetId(preset.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-row gap-3">
        <ToggleRow
          label={tSettings("appearance.enabledLabel")}
          description={tSettings("appearance.enabledDescription")}
          checked={enabled}
          onChange={setEnabled}
        />
        <ToggleRow
          label={tSettings("appearance.animatedLabel")}
          description={tSettings("appearance.animatedDescription")}
          checked={animated}
          onChange={setAnimated}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {tSettings("appearance.intensity")}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round(intensity * 100)}%
          </div>
        </div>
        <input
          type="range"
          min={0.3}
          max={1.8}
          step={0.05}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
          className="w-full accent-sky-500"
        />
      </div>
    </div>
  );
}
