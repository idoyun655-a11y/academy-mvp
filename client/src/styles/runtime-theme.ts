import type { CSSProperties } from "react";
import { theme } from "@/styles/design-system";

const cssVar = (name: string, fallback: string) => `var(${name}, ${fallback})`;

export const uiThemeVars = {
  bgPrimary: cssVar("--ui-bg-primary", theme.colors.background.primary),
  bgSecondary: cssVar("--ui-bg-secondary", theme.colors.background.secondary),
  bgTertiary: cssVar("--ui-bg-tertiary", theme.colors.background.tertiary),
  surface: cssVar("--ui-surface", theme.colors.background.tertiary),
  surfaceAlt: cssVar("--ui-surface-alt", theme.colors.background.secondary),
  borderPrimary: cssVar("--ui-border-primary", theme.colors.border.primary),
  borderSecondary: cssVar("--ui-border-secondary", theme.colors.border.secondary),
  textPrimary: cssVar("--ui-text-primary", theme.colors.text.primary),
  textSecondary: cssVar("--ui-text-secondary", theme.colors.text.secondary),
  textTertiary: cssVar("--ui-text-tertiary", theme.colors.text.tertiary),
  accentPrimary: cssVar("--ui-accent-primary", theme.colors.accent.primary),
  accentSecondary: cssVar("--ui-accent-secondary", theme.colors.accent.secondary),
  accentSoft: cssVar("--ui-accent-soft", "rgba(0, 132, 255, 0.12)"),
  success: cssVar("--ui-status-success", theme.colors.status.success),
  warning: cssVar("--ui-status-warning", theme.colors.status.warning),
  error: cssVar("--ui-status-error", theme.colors.status.error),
  info: cssVar("--ui-status-info", theme.colors.status.info),
} as const;

export const portalLightThemeVars = {
  "--ui-bg-primary": "#f7faff",
  "--ui-bg-secondary": "#eef4ff",
  "--ui-bg-tertiary": "#ffffff",
  "--ui-surface": "#ffffff",
  "--ui-surface-alt": "#f3f7ff",
  "--ui-border-primary": "#d5e2fb",
  "--ui-border-secondary": "#e7eefc",
  "--ui-text-primary": "#10203a",
  "--ui-text-secondary": "#264269",
  "--ui-text-tertiary": "#6b7a99",
  "--ui-accent-primary": "#2563eb",
  "--ui-accent-secondary": "#06b6d4",
  "--ui-accent-soft": "rgba(37, 99, 235, 0.12)",
  "--ui-status-success": "#10b981",
  "--ui-status-warning": "#f59e0b",
  "--ui-status-error": "#ef4444",
  "--ui-status-info": "#7c3aed",
} as CSSProperties;
