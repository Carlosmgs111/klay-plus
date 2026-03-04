import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "klay-theme";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemPreference();
  return theme;
}

function applyToDOM(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (resolved === "dark") {
    html.classList.add("dark");
    html.style.colorScheme = "dark";
  } else {
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeRaw] = useState<Theme>("system");
  const [hasMounted, setHasMounted] = useState(false);

  // During SSR and initial client render, always resolve to "light"
  // to match server HTML. The inline script in DashboardLayout.astro
  // already applies the correct dark class to prevent visual flash.
  const resolved = hasMounted ? resolve(theme) : "light";

  // Read stored theme after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      setThemeRaw(stored);
    }
    setHasMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeRaw(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyToDOM(resolve(next));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = resolve(theme);
    setTheme(current === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Apply theme to DOM after mount and when resolved changes
  useEffect(() => {
    if (!hasMounted) return;
    applyToDOM(resolved);
  }, [resolved, hasMounted]);

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyToDOM(getSystemPreference());
      // Force re-render so `resolved` updates
      setThemeRaw("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
