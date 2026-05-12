"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | `data-${string}`;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  enableSystem?: boolean;
  forcedTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  forcedTheme?: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  systemTheme?: ResolvedTheme;
  theme: Theme;
  themes: Theme[];
};

const ThemeContext = React.createContext<ThemeProviderState | undefined>(
  undefined,
);

const colorThemes = ["light", "dark"] as const;

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function disableTransitions() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => document.head.removeChild(style), 1);
  };
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  disableTransitionOnChange = false,
  enableColorScheme = true,
  enableSystem = true,
  forcedTheme,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] =
    React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey);

      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      }

      if (storedTheme === "system" && enableSystem) {
        setThemeState(storedTheme);
      }
    } catch {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme, enableSystem, storageKey]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(getSystemTheme());

    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);

    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const fallbackTheme = defaultTheme === "system" ? "dark" : defaultTheme;
      const resolvedTheme =
        nextTheme === "system" && enableSystem ? systemTheme : nextTheme;
      const themeToApply =
        resolvedTheme === "system" ? fallbackTheme : resolvedTheme;
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitions()
        : undefined;
      const root = document.documentElement;

      if (attribute === "class") {
        root.classList.remove(...colorThemes);
        root.classList.add(themeToApply);
      } else {
        root.setAttribute(attribute, themeToApply);
      }

      if (enableColorScheme) {
        root.style.colorScheme = themeToApply;
      }

      restoreTransitions?.();
    },
    [
      attribute,
      defaultTheme,
      disableTransitionOnChange,
      enableColorScheme,
      enableSystem,
      systemTheme,
    ],
  );

  React.useEffect(() => {
    applyTheme(forcedTheme ?? theme);
  }, [applyTheme, forcedTheme, theme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);

      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Ignore storage errors so theme changes still apply for this session.
      }
    },
    [storageKey],
  );

  const resolvedTheme = React.useMemo<ResolvedTheme>(() => {
    const activeTheme = forcedTheme ?? theme;
    const fallbackTheme = defaultTheme === "system" ? "dark" : defaultTheme;

    if (activeTheme === "system" && enableSystem) {
      return systemTheme;
    }

    return activeTheme === "system" ? fallbackTheme : activeTheme;
  }, [defaultTheme, enableSystem, forcedTheme, systemTheme, theme]);

  const value = React.useMemo<ThemeProviderState>(
    () => ({
      forcedTheme,
      resolvedTheme,
      setTheme,
      systemTheme: enableSystem ? systemTheme : undefined,
      theme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
    }),
    [enableSystem, forcedTheme, resolvedTheme, setTheme, systemTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
