export type BookTheme = "light" | "dark";

export interface ReaderThemeTokens {
  name: string;
  label: string;
  bgCanvas: string;
  bgHud: string;
  bgHudCard: string;
  borderColor: string;
  borderSubtle: string;
  textMain: string;
  textMuted: string;
  textFaint: string;
  accentColor: string;
  accentBg: string;
  trackBg: string;
  trackFill: string;
  btnBg: string;
  btnBorder: string;
}

/**
 * Editorial Reader Tokens locked from prototype Direction B (Warm Bunkobon Dual-Mode)
 */
export const EDITORIAL_THEMES: Record<"light" | "dark", ReaderThemeTokens> = {
  light: {
    name: "light",
    label: "Warm Cream (Siang)",
    bgCanvas: "#f6f0e8",
    bgHud: "rgba(238, 229, 218, 0.94)",
    bgHudCard: "#e4d7c6",
    borderColor: "#d8c8b4",
    borderSubtle: "#e6dac9",
    textMain: "#2b2420",
    textMuted: "#7d7065",
    textFaint: "#9c8e82",
    accentColor: "#92400e",
    accentBg: "#fef3c7",
    trackBg: "#dfd0be",
    trackFill: "#92400e",
    btnBg: "#f9f5f0",
    btnBorder: "#d4c3ae",
  },
  dark: {
    name: "dark",
    label: "Midnight Espresso (Malam)",
    bgCanvas: "#121010",
    bgHud: "rgba(24, 21, 20, 0.95)",
    bgHudCard: "#201c1a",
    borderColor: "#322b27",
    borderSubtle: "#25201d",
    textMain: "#e2dad2",
    textMuted: "#9e9187",
    textFaint: "#6e645c",
    accentColor: "#f59e0b",
    accentBg: "#2d2010",
    trackBg: "#27221f",
    trackFill: "#d97706",
    btnBg: "#1c1816",
    btnBorder: "#38302b",
  },
};

export interface ReaderSettings {
  theme: "light" | "dark";
  fontSize: number; // in px, range 12 - 24
  lineHeight: number; // e.g. 1.85
  fontFamily: "serif" | "sans";
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: "dark",
  fontSize: 16,
  lineHeight: 1.85,
  fontFamily: "serif",
};
