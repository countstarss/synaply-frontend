"use client";

import * as React from "react";
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
            背景光晕
          </div>
          <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
            控制全局氛围光的颜色和动态效果。偏好按账号和工作区分别保存在本地。
          </div>
        </div>
      </div>

      <div className="relative h-40 overflow-hidden rounded-lg border border-app-border bg-app-bg">
        <AmbientGlow />
        <div className="relative z-10 flex h-full items-end p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            实时预览
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          光效模式
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          颜色预设
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

      <div className="space-y-3">
        <ToggleRow
          label="启用背景光晕"
          description="关闭后将不再渲染氛围光，页面背景保持纯色。"
          checked={enabled}
          onChange={setEnabled}
        />
        <ToggleRow
          label="动态效果"
          description="开启后当前光效会缓慢流动；关闭后保留静态状态。尊重系统的 reduced-motion 设置。"
          checked={animated}
          onChange={setAnimated}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">光晕强度</div>
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
