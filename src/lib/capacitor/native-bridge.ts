import { Capacitor } from "@capacitor/core";

let Preferences: typeof import("@capacitor/preferences").Preferences | null = null;
let Haptics: typeof import("@capacitor/haptics").Haptics | null = null;
let StatusBar: typeof import("@capacitor/status-bar").StatusBar | null = null;

async function loadPlugins() {
  if (Capacitor.isNativePlatform()) {
    const [prefs, haptics, statusBar] = await Promise.all([
      import("@capacitor/preferences"),
      import("@capacitor/haptics"),
      import("@capacitor/status-bar"),
    ]);
    Preferences = prefs.Preferences;
    Haptics = haptics.Haptics;
    StatusBar = statusBar.StatusBar;
  }
}

export async function initNativePlugins(): Promise<void> {
  await loadPlugins();
  if (StatusBar) {
    await StatusBar.setStyle({ style: "DARK" as any });
    await StatusBar.setBackgroundColor({ color: "#090a0f" });
  }
}

export async function triggerHapticFeedback(type: "light" | "medium" | "heavy"): Promise<void> {
  if (!Haptics) return;
  const impactType = type === "light" ? "LIGHT" : type === "medium" ? "MEDIUM" : "HEAVY";
  await Haptics.impact({ style: impactType as any });
}

export async function setStatusBarTheme(theme: "dark" | "light"): Promise<void> {
  if (!StatusBar) return;
  await StatusBar.setStyle({ style: theme === "dark" ? ("DARK" as any) : ("LIGHT" as any) });
}

export async function saveToPreferences(key: string, value: string): Promise<void> {
  if (Preferences) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(`astread_${key}`, value);
  }
}

export async function loadFromPreferences(key: string): Promise<string | null> {
  if (Preferences) {
    const result = await Preferences.get({ key });
    return result.value;
  }
  return localStorage.getItem(`astread_${key}`);
}

export async function removeFromPreferences(key: string): Promise<void> {
  if (Preferences) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(`astread_${key}`);
  }
}
