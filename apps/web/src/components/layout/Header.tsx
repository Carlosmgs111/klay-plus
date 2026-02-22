import { useRuntimeMode } from "../../contexts/RuntimeModeContext.js";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { mode, setMode, isInitializing } = useRuntimeMode();

  return (
    <header className="fixed top-0 left-sidebar right-0 h-header bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {/* Runtime Mode Toggle */}
      <div className="flex items-center gap-3">
        {isInitializing && (
          <span className="text-xs text-gray-400 animate-pulse">Initializing...</span>
        )}

        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode("server")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "server"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mode === "server" ? "bg-primary-500" : "bg-gray-300"
              }`}
            />
            Server
          </button>
          <button
            onClick={() => setMode("browser")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "browser"
                ? "bg-white text-success-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mode === "browser" ? "bg-success-500" : "bg-gray-300"
              }`}
            />
            Browser
          </button>
        </div>
      </div>
    </header>
  );
}
