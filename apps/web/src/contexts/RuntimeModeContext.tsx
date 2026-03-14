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
import type { SecretStore } from "@klay/core/secrets";

interface RuntimeModeContextValue {
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  service: PipelineService | null;
  lifecycleService: LifecycleService | null;
  isInitializing: boolean;
  reinitialize: () => void;
  configStore: ConfigStore | null;
  secretStore: SecretStore | null;
  infrastructureProfile: InfrastructureProfile | null;
  setInfrastructureProfile: (profile: InfrastructureProfile) => void;
}

const RuntimeModeContext = createContext<RuntimeModeContextValue | null>(null);

const STORAGE_KEY = "klay-runtime-mode";
const LEGACY_API_KEYS_KEY = "klay-api-keys";

// ─── Init helpers ────────────────────────────────────────────────────────────

interface InitResult {
  configStore: ConfigStore;
  secretStore: SecretStore;
  profile: InfrastructureProfile;
  pipelineService: PipelineService;
  lifecycleService: LifecycleService;
}

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

async function initServerMode(
  cachedStore: ConfigStore | null,
  cachedProfile: InfrastructureProfile | null,
): Promise<InitResult> {
  let store = cachedStore;
  if (!store) {
    const { ServerConfigService } = await import("../services/server-config-service");
    store = new ServerConfigService();
  }

  const { InMemorySecretStore } = await import("@klay/core/secrets");
  const secretStore = new InMemorySecretStore();

  let profile = cachedProfile;
  if (!profile) {
    const { resolveInfrastructureProfile } = await import("@klay/core/config");
    profile = await resolveInfrastructureProfile({ provider: "server", configStore: store });
  }

  const [{ ServerPipelineService }, { ServerLifecycleService }] = await Promise.all([
    import("../services/server-pipeline-service"),
    import("../services/server-lifecycle-service"),
  ]);

  return {
    configStore: store,
    secretStore,
    profile,
    pipelineService: new ServerPipelineService(),
    lifecycleService: new ServerLifecycleService(),
  };
}

async function initBrowserMode(
  cachedStore: ConfigStore | null,
  cachedProfile: InfrastructureProfile | null,
): Promise<InitResult> {
  let store = cachedStore;
  if (!store) {
    const { IndexedDBConfigStore } = await import("@klay/core/config/browser");
    store = new IndexedDBConfigStore();
    await migrateLocalStorageKeys(store);
  }

  const { InMemorySecretStore } = await import("@klay/core/secrets");
  const secretStore = new InMemorySecretStore();

  let profile = cachedProfile;
  if (!profile) {
    const { resolveInfrastructureProfile } = await import("@klay/core/config");
    profile = await resolveInfrastructureProfile({ provider: "browser", configStore: store });
  }

  const [{ BrowserPipelineService }, { BrowserLifecycleService }] = await Promise.all([
    import("../services/browser-pipeline-service"),
    import("../services/browser-lifecycle-service"),
  ]);

  return {
    configStore: store,
    secretStore,
    profile,
    pipelineService: new BrowserPipelineService(store, profile),
    lifecycleService: new BrowserLifecycleService(store, profile),
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function RuntimeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RuntimeMode>("browser");
  const [modeResolved, setModeResolved] = useState(false);
  const [service, setService] = useState<PipelineService | null>(null);
  const [lifecycleService, setLifecycleService] = useState<LifecycleService | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [reinitKey, setReinitKey] = useState(0);
  const [configStore, setConfigStore] = useState<ConfigStore | null>(null);
  const [secretStore, setSecretStore] = useState<SecretStore | null>(null);
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

  // Read stored mode after mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as RuntimeMode | null;
    if (stored) {
      profileRef.current = null;
      setModeState(stored);
    }
    setModeResolved(true);
  }, []);

  const setMode = (newMode: RuntimeMode) => {
    profileRef.current = null;
    configStoreRef.current = null;
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  // Initialize services when mode changes
  useEffect(() => {
    if (!modeResolved) return;

    let cancelled = false;
    setIsInitializing(true);

    const init = mode === "server"
      ? initServerMode(configStoreRef.current, profileRef.current)
      : initBrowserMode(configStoreRef.current, profileRef.current);

    init
      .then((result) => {
        if (cancelled) return;
        configStoreRef.current = result.configStore;
        profileRef.current = result.profile;
        setConfigStore(result.configStore);
        setSecretStore(result.secretStore);
        setInfrastructureProfileState(result.profile);
        setService(result.pipelineService);
        setLifecycleService(result.lifecycleService);
      })
      .catch((err) => {
        console.error("Failed to initialize services:", err);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => { cancelled = true; };
  }, [mode, reinitKey, modeResolved]);

  return (
    <RuntimeModeContext.Provider value={{ mode, setMode, service, lifecycleService, isInitializing, reinitialize, configStore, secretStore, infrastructureProfile, setInfrastructureProfile }}>
      {children}
    </RuntimeModeContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

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
