import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { RuntimeMode } from "../services/types";
import type { PipelineService } from "../services/pipeline-service";
import type { LifecycleService } from "../services/lifecycle-service";
import type { ConfigStore, InfrastructureProfile } from "@klay/core/config";

interface RuntimeModeContextValue {
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  service: PipelineService | null;
  lifecycleService: LifecycleService | null;
  isInitializing: boolean;
  reinitialize: () => void;
  configStore: ConfigStore | null;
  infrastructureProfile: InfrastructureProfile | null;
  setInfrastructureProfile: (profile: InfrastructureProfile) => void;
}

const RuntimeModeContext = createContext<RuntimeModeContextValue | null>(null);

const STORAGE_KEY = "klay-runtime-mode";
const LEGACY_API_KEYS_KEY = "klay-api-keys";

/**
 * One-time migration: read API keys from localStorage and write to IndexedDBConfigStore.
 */
async function migrateLocalStorageKeys(store: ConfigStore): Promise<void> {
  try {
    const raw = localStorage.getItem(LEGACY_API_KEYS_KEY);
    if (!raw) return;

    const keys = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(keys)) {
      if (v) await store.set(k, v);
    }
    localStorage.removeItem(LEGACY_API_KEYS_KEY);
  } catch {
    // Silently ignore migration errors
  }
}

export function RuntimeModeProvider({ children }: { children: ReactNode }) {
  // Always start as "server" to match SSR. Real mode read in useEffect.
  const [mode, setModeState] = useState<RuntimeMode>("server");
  const [service, setService] = useState<PipelineService | null>(null);
  const [lifecycleService, setLifecycleService] = useState<LifecycleService | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [reinitKey, setReinitKey] = useState(0);
  const [configStore, setConfigStore] = useState<ConfigStore | null>(null);
  const [infrastructureProfile, setInfrastructureProfileState] =
    useState<InfrastructureProfile | null>(null);
  const configStoreRef = useRef<ConfigStore | null>(null);
  const profileRef = useRef<InfrastructureProfile | null>(null);

  const reinitialize = useCallback(() => setReinitKey((k) => k + 1), []);

  const setInfrastructureProfile = useCallback(
    async (profile: InfrastructureProfile) => {
      const store = configStoreRef.current;
      if (store) {
        const { saveProfileToStore } = await import("@klay/core/config");
        await saveProfileToStore(store, profile);
      }
      profileRef.current = profile;
      setInfrastructureProfileState(profile);
      setReinitKey((k) => k + 1);
    },
    [],
  );

  // Read stored mode after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as RuntimeMode | null;
    if (stored && stored !== "server") {
      profileRef.current = null; // Reset so profile resolves for the stored mode
      setModeState(stored);
    }
  }, []);

  const setMode = (newMode: RuntimeMode) => {
    // Reset cached profile so it re-resolves for the new runtime
    profileRef.current = null;
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  useEffect(() => {
    let cancelled = false;
    setIsInitializing(true);

    (async () => {
      try {
        if (mode === "server") {
          // Resolve a default profile for server so the UI can show infra settings
          if (!profileRef.current) {
            const { resolveInfrastructureProfile } = await import("@klay/core/config");
            const profile = await resolveInfrastructureProfile({ provider: "server" });
            profileRef.current = profile;
          }

          const [{ ServerPipelineService }, { ServerLifecycleService }] =
            await Promise.all([
              import("../services/server-pipeline-service"),
              import("../services/server-lifecycle-service"),
            ]);
          if (!cancelled) {
            setInfrastructureProfileState(profileRef.current);
            setService(new ServerPipelineService());
            setLifecycleService(new ServerLifecycleService());
            setConfigStore(null);
          }
        } else {
          // Create or reuse ConfigStore
          let store = configStoreRef.current;
          if (!store) {
            const { IndexedDBConfigStore } = await import("@klay/core/config");
            store = new IndexedDBConfigStore();
            await migrateLocalStorageKeys(store);
            configStoreRef.current = store;
          }

          // Resolve infrastructure profile from persisted state
          let profile = profileRef.current;
          if (!profile) {
            const { resolveInfrastructureProfile } = await import("@klay/core/config");
            profile = await resolveInfrastructureProfile({
              provider: "browser",
              configStore: store,
            });
            profileRef.current = profile;
          }

          const [{ BrowserPipelineService }, { BrowserLifecycleService }] =
            await Promise.all([
              import("../services/browser-pipeline-service"),
              import("../services/browser-lifecycle-service"),
            ]);
          if (!cancelled) {
            setConfigStore(store);
            setInfrastructureProfileState(profile);
            setService(new BrowserPipelineService(store, profile));
            setLifecycleService(new BrowserLifecycleService(store, profile));
          }
        }
      } catch (err) {
        console.error("Failed to initialize services:", err);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, reinitKey]);

  return (
    <RuntimeModeContext.Provider value={{ mode, setMode, service, lifecycleService, isInitializing, reinitialize, configStore, infrastructureProfile, setInfrastructureProfile }}>
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

export function useLifecycleService(): LifecycleService {
  const { lifecycleService, isInitializing } = useRuntimeMode();
  if (!lifecycleService) {
    throw new Error(
      isInitializing
        ? "Lifecycle service is still initializing"
        : "Lifecycle service is not available",
    );
  }
  return lifecycleService;
}
