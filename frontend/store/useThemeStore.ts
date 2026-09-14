import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
  hydrate: () => void;
}

function applyDom(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    applyDom(theme);
    localStorage.setItem("ryvv-theme", theme);
    set({ theme });
  },
  toggle: () => {
    const next = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },
  hydrate: () => {
    const saved = localStorage.getItem("ryvv-theme") as ThemeMode | null;
    const prefersDark =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const theme = saved ?? (prefersDark ? "dark" : "light");
    applyDom(theme);
    set({ theme });
  },
}));
