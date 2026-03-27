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
import type { KnowledgeService } from "../services/knowledge-service";
import type { ConfigStore, InfrastructureProfile } from "@klay/core/config";
import type { SecretStore } from "@klay/core/secrets";

interface RuntimeModeContextValue {
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  service: KnowledgeService | null;
  isInitializing: boolean;
  reinitialize: () => void;
  configStore: ConfigStore | null;
  secretStore: SecretStore | null;
  infrastructureProfile: InfrastructureProfile | null;
  setInfrastructureProfile: (profile: InfrastructureProfile) => void;
  /** True when running on Vercel — mode locked to browser */
  isModeLocked: boolean;
}

const RuntimeModeContext = createContext<RuntimeModeContextValue | null>(null);

const STORAGE_KEY = "klay-runtime-mode";
const LEGACY_API_KEYS_KEY = "klay-api-keys";
const IS_VERCEL = import.meta.env.PUBLIC_IS_VERCEL === true || import.meta.env.PUBLIC_IS_VERCEL === "true";

// ─── Init helpers ────────────────────────────────────────────────────────────

interface InitResult {
  configStore: ConfigStore;
  secretStore: SecretStore;
  profile: InfrastructureProfile;
  service: KnowledgeService;
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

  const { ServerKnowledgeService } = await import("../services/server-knowledge-service");

  return {
    configStore: store,
    secretStore,
    profile,
    service: new ServerKnowledgeService(),
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

  const { BrowserKnowledgeService } = await import("../services/browser-knowledge-service");

  return {
    configStore: store,
    secretStore,
    profile,
    service: new BrowserKnowledgeService(store, profile),
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function RuntimeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RuntimeMode>("browser");
  const [modeResolved, setModeResolved] = useState(false);
  const [service, setService] = useState<KnowledgeService | null>(null);
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

  // Read stored mode after mount (Vercel: always browser)
  useEffect(() => {
    if (IS_VERCEL) {
      setModeState("browser");
    } else {
      const stored = localStorage.getItem(STORAGE_KEY) as RuntimeMode | null;
      if (stored) {
        profileRef.current = null;
        setModeState(stored);
      }
    }
    setModeResolved(true);
  }, []);

  const setMode = (newMode: RuntimeMode) => {
    if (IS_VERCEL) return; // locked to browser on Vercel
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
        setService(result.service);
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
    <RuntimeModeContext.Provider value={{ mode, setMode, service, isInitializing, reinitialize, configStore, secretStore, infrastructureProfile, setInfrastructureProfile, isModeLocked: IS_VERCEL }}>
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

export function useKnowledgeService(): KnowledgeService {
  const { service, isInitializing } = useRuntimeMode();
  if (!service) {
    throw new Error(
      isInitializing
        ? "Knowledge service is still initializing"
        : "Knowledge service is not available",
    );
  }
  return service;
}

/** @deprecated Use `useKnowledgeService()` instead. */
export const usePipelineService = useKnowledgeService;
/** @deprecated Use `useKnowledgeService()` instead. */
export const useLifecycleService = useKnowledgeService;
