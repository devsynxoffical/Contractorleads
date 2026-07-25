"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { isPublicLightPath } from "@/lib/theme-paths";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "lf-theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function writeDomTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

function persistTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Apply theme to the document. Optionally persist to localStorage. */
export function applyTheme(theme: ThemeMode, opts?: { persist?: boolean }) {
  writeDomTheme(theme);
  if (opts?.persist !== false) persistTheme(theme);
}

function readDomTheme(): ThemeMode | null {
  if (typeof document === "undefined") return null;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return null;
}

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
}) {
  const pathname = usePathname();
  const forceLight = isPublicLightPath(pathname);

  // Match what ThemeScript already painted — avoids a light→dark flash.
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return readDomTheme() ?? initialTheme;
  });
  const [preference, setPreference] = useState<ThemeMode>(() => {
    return readDomTheme() ?? initialTheme;
  });

  useEffect(() => {
    const stored = readStoredTheme() ?? initialTheme;
    setPreference(stored);

    if (forceLight) {
      // Public pages stay light without overwriting the user's app preference.
      setThemeState("light");
      applyTheme("light", { persist: false });
      return;
    }

    setThemeState(stored);
    applyTheme(stored, { persist: false });
  }, [forceLight, initialTheme, pathname]);

  const setTheme = useCallback(
    (value: ThemeMode) => {
      setPreference(value);
      if (forceLight) {
        // Remember preference for the app, but keep public pages light.
        persistTheme(value);
        setThemeState("light");
        applyTheme("light", { persist: false });
        return;
      }
      setThemeState(value);
      applyTheme(value);
    },
    [forceLight],
  );

  const toggleTheme = useCallback(() => {
    setTheme(preference === "dark" ? "light" : "dark");
  }, [preference, setTheme]);

  const value = useMemo(
    () => ({
      theme: forceLight ? "light" : theme,
      setTheme,
      toggleTheme,
    }),
    [forceLight, theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light" as ThemeMode,
      setTheme: (_: ThemeMode) => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
