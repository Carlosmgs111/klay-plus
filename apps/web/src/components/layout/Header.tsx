import { useRuntimeMode } from "../../contexts/RuntimeModeContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../shared/Icon";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { mode, setMode, isInitializing } = useRuntimeMode();
  const { resolved, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 left-0 flex items-center justify-between px-6 z-10 backdrop-blur-xl w-full h-20">
      {/* Page Title */}
      <h1 className="text-lg font-semibold letter-spacing-[-0.02em]">{title}</h1>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isInitializing && (
          <span className="text-xs animate-pulse mr-2">Initializing...</span>
        )}

        {/* Runtime Mode Toggle */}
        <div className="flex items-center rounded-lg p-[3px]">
          <button
            onClick={() => setMode("server")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-black dark:text-white"
            style={{
              backgroundColor:
                mode === "server" ? "var(--accent-primary)" : "transparent",
              boxShadow: mode === "server" ? "var(--shadow-xs)" : "none",
              transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: mode === "server" ? "#fff" : "currentColor",
                opacity: mode === "server" ? 1 : 0.3,
                boxShadow:
                  mode === "server" ? "0 0 4px rgba(255,255,255,0.6)" : "none",
                transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            Server
          </button>
          <button
            onClick={() => setMode("browser")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-black dark:text-white"
            style={{
              backgroundColor:
                mode === "browser" ? "var(--semantic-success)" : "transparent",
              boxShadow: mode === "browser" ? "var(--shadow-xs)" : "none",
              transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: mode === "browser" ? "#fff" : "currentColor",
                opacity: mode === "browser" ? 1 : 0.3,
                boxShadow:
                  mode === "browser" ? "0 0 4px rgba(255,255,255,0.6)" : "none",
                transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            Browser
          </button>
        </div>

        {/* Divider */}
        <div
          className="w-px h-5 mx-1"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg"
          style={{
            color: "var(--text-tertiary)",
            transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-3)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
          aria-label="Toggle theme"
        >
          <Icon name={resolved === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
