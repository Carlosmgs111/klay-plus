import { useRuntimeMode } from "../../contexts/RuntimeModeContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../shared/Icon";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const { mode, setMode, isInitializing } = useRuntimeMode();
  const { resolved, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 left-0 flex items-center justify-between px-6 z-10 backdrop-blur-xl w-full h-20 bg-[var(--header-bg)] border-b border-subtle">
      {/* Page Title / Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1 text-lg font-semibold tracking-heading">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-tertiary">
                  <Icon name="chevron-right" className="text-sm" />
                </span>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:underline text-secondary"
                >
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <h1 className="text-lg font-semibold tracking-heading">{title}</h1>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isInitializing && (
          <span className="text-xs animate-pulse mr-2">Initializing...</span>
        )}

        {/* Runtime Mode Toggle */}
        <div className="flex items-center rounded-lg p-[3px]">
          <button
            onClick={() => setMode("server")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-fast ease-out-expo ${mode === "server" ? "bg-accent text-white shadow-xs" : "bg-transparent text-primary"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-fast ease-out-expo ${mode === "server" ? "bg-white opacity-100 shadow-[0_0_4px_rgba(255,255,255,0.6)]" : "bg-current opacity-30"}`}
            />
            Server
          </button>
          <button
            onClick={() => setMode("browser")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-fast ease-out-expo ${mode === "browser" ? "bg-success text-white shadow-xs" : "bg-transparent text-primary"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-fast ease-out-expo ${mode === "browser" ? "bg-white opacity-100 shadow-[0_0_4px_rgba(255,255,255,0.6)]" : "bg-current opacity-30"}`}
            />
            Browser
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1 bg-[var(--border-default)]" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-tertiary hover:text-primary hover:bg-surface-3 transition-all duration-fast ease-out-expo"
          aria-label="Toggle theme"
        >
          <Icon name={resolved === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
