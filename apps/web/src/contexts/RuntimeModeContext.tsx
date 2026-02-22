import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { RuntimeMode } from "../services/types.js";
import type { PipelineService } from "../services/pipeline-service.js";

interface RuntimeModeContextValue {
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  service: PipelineService | null;
  isInitializing: boolean;
}

const RuntimeModeContext = createContext<RuntimeModeContextValue | null>(null);

const STORAGE_KEY = "klay-runtime-mode";

export function RuntimeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RuntimeMode>(() => {
    if (typeof window === "undefined") return "server";
    return (localStorage.getItem(STORAGE_KEY) as RuntimeMode) ?? "server";
  });
  const [service, setService] = useState<PipelineService | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false);

  const setMode = (newMode: RuntimeMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  };

  useEffect(() => {
    // Prevent double-init in StrictMode
    if (initRef.current && service) return;
    initRef.current = true;

    let cancelled = false;
    setIsInitializing(true);

    (async () => {
      try {
        if (mode === "server") {
          const { ServerPipelineService } = await import(
            "../services/server-pipeline-service.js"
          );
          if (!cancelled) setService(new ServerPipelineService());
        } else {
          const { BrowserPipelineService } = await import(
            "../services/browser-pipeline-service.js"
          );
          if (!cancelled) setService(new BrowserPipelineService());
        }
      } catch (err) {
        console.error("Failed to initialize pipeline service:", err);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <RuntimeModeContext.Provider value={{ mode, setMode, service, isInitializing }}>
      {children}
    </RuntimeModeContext.Provider>
  );
}

export function useRuntimeMode(): RuntimeModeContextValue {
  const ctx = useContext(RuntimeModeContext);
  if (!ctx) {
    throw new Error("useRuntimeMode must be used within a RuntimeModeProvider");
  }
  return ctx;
}

export function usePipelineService(): PipelineService {
  const { service, isInitializing } = useRuntimeMode();
  if (!service) {
    throw new Error(
      isInitializing
        ? "Pipeline service is still initializing"
        : "Pipeline service is not available",
    );
  }
  return service;
}
