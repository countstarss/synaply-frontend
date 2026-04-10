import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GlowPreset {
  id: string;
  label: string;
  colors: [string, string, string];
}

export type GlowMode = "glow" | "aurora" | "ribbon";

export interface GlowModeOption {
  id: GlowMode;
  label: string;
  description: string;
}

export const GLOW_MODES: GlowModeOption[] = [
  {
    id: "glow",
    label: "定点光晕",
    description: "柔和光斑停留在固定锚点附近，适合低干扰背景。",
  },
  {
    id: "aurora",
    label: "极光",
    description: "模拟极光帘幕的波动层次，动态时会缓慢流动。",
  },
  {
    id: "ribbon",
    label: "流光",
    description: "更宽的斜向光带在背景中游移，适合更有能量的界面氛围。",
  },
];

// Each preset defines three hues. The primary color fills the three larger
// blobs and the accent color fills the fourth — matching the reference SVG
// (three blue circles + one purple accent).
export const GLOW_PRESETS: GlowPreset[] = [
  {
    id: "azure",
    label: "Azure",
    colors: ["#0788FF", "#7C33FF", "#38bdf8"],
  },
  {
    id: "violet",
    label: "Violet",
    colors: ["#8b5cf6", "#ec4899", "#a855f7"],
  },
  {
    id: "emerald",
    label: "Emerald",
    colors: ["#10b981", "#06b6d4", "#34d399"],
  },
  {
    id: "sunset",
    label: "Sunset",
    colors: ["#f97316", "#f43f5e", "#facc15"],
  },
  {
    id: "rose",
    label: "Rose",
    colors: ["#f472b6", "#a855f7", "#fb7185"],
  },
  {
    id: "slate",
    label: "Slate",
    colors: ["#64748b", "#94a3b8", "#cbd5f5"],
  },
];

interface AppearancePreferences {
  presetId: string;
  mode: GlowMode;
  animated: boolean;
  enabled: boolean;
  intensity: number;
}

const DEFAULT_PREFERENCES: AppearancePreferences = {
  presetId: "azure",
  mode: "glow",
  animated: false,
  enabled: true,
  intensity: 1,
};

interface AppearanceScope {
  userId: string | null;
  workspaceId: string | null;
}

interface AppearanceState extends AppearancePreferences {
  scope: AppearanceScope;
  scopedPreferences: Record<string, AppearancePreferences>;
  setScope: (scope: AppearanceScope) => void;
  setPresetId: (presetId: string) => void;
  setMode: (mode: GlowMode) => void;
  setAnimated: (animated: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: number) => void;
}

function scopeKey(scope: AppearanceScope) {
  return `${scope.userId ?? "anon"}::${scope.workspaceId ?? "global"}`;
}

function readPreferences(
  scopedPreferences: Record<string, AppearancePreferences>,
  scope: AppearanceScope,
): AppearancePreferences {
  return normalizePreferences(scopedPreferences[scopeKey(scope)]);
}

function isGlowMode(value: unknown): value is GlowMode {
  return GLOW_MODES.some((mode) => mode.id === value);
}

function normalizePreferences(
  preferences?: Partial<AppearancePreferences>,
): AppearancePreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    mode: isGlowMode(preferences?.mode)
      ? preferences.mode
      : DEFAULT_PREFERENCES.mode,
  };
}

function writePreferences(
  scopedPreferences: Record<string, AppearancePreferences>,
  scope: AppearanceScope,
  patch: Partial<AppearancePreferences>,
): Record<string, AppearancePreferences> {
  const key = scopeKey(scope);
  const current = readPreferences(scopedPreferences, scope);
  return {
    ...scopedPreferences,
    [key]: { ...current, ...patch },
  };
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      scope: { userId: null, workspaceId: null },
      scopedPreferences: {},
      setScope: (scope) => {
        const { scopedPreferences } = get();
        const prefs = readPreferences(scopedPreferences, scope);
        set({ scope, ...prefs });
      },
      setPresetId: (presetId) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { presetId });
        set({ presetId, scopedPreferences: next });
      },
      setMode: (mode) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { mode });
        set({ mode, scopedPreferences: next });
      },
      setAnimated: (animated) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { animated });
        set({ animated, scopedPreferences: next });
      },
      setEnabled: (enabled) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { enabled });
        set({ enabled, scopedPreferences: next });
      },
      setIntensity: (intensity) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { intensity });
        set({ intensity, scopedPreferences: next });
      },
    }),
    {
      name: "synaply.appearance",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ scopedPreferences: state.scopedPreferences }),
    },
  ),
);

export function getGlowPreset(presetId: string): GlowPreset {
  return GLOW_PRESETS.find((preset) => preset.id === presetId) ?? GLOW_PRESETS[0];
}
