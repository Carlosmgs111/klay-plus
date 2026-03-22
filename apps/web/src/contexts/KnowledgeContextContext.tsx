import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRuntimeMode } from "./RuntimeModeContext";
import type { GetContextDetailsResult, ContextSourceDetailDTO } from "@klay/core";

export interface ContextError {
  message: string;
  code?: string;
}

interface ContextDetailValue {
  contextId: string;
  detail: GetContextDetailsResult | null;
  loading: boolean;
  error: ContextError | null;
  refresh: () => void;
}

const UnitContext = createContext<ContextDetailValue | null>(null);

interface KnowledgeContextProviderProps {
  contextId: string;
  children: ReactNode;
}

export function KnowledgeContextProvider({
  contextId,
  children,
}: KnowledgeContextProviderProps) {
  const { service, isInitializing } = useRuntimeMode();
  const [detail, setDetail] = useState<GetContextDetailsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ContextError | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const result = await service.contexts.get({ contextId });
      if (result.success) {
        setDetail(result.data);
      } else {
        setError({
          message: result.error?.message ?? "Failed to fetch context details",
          code: result.error?.code,
        });
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }, [service, contextId]);

  useEffect(() => {
    if (!isInitializing && service) {
      fetchDetails();
    }
  }, [isInitializing, service, fetchDetails]);

  const value = useMemo<ContextDetailValue>(
    () => ({
      contextId,
      detail,
      loading: loading || isInitializing,
      error,
      refresh: fetchDetails,
    }),
    [contextId, detail, loading, isInitializing, error, fetchDetails],
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useKnowledgeContext(): ContextDetailValue {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    throw new Error("useKnowledgeContext must be used within a KnowledgeContextProvider");
  }
  return ctx;
}
