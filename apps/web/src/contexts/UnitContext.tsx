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
import type { ContentManifestEntry } from "@klay/core";

interface UnitContextValue {
  unitId: string;
  manifests: ContentManifestEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const UnitContext = createContext<UnitContextValue | null>(null);

interface UnitContextProviderProps {
  unitId: string;
  children: ReactNode;
}

export function UnitContextProvider({
  unitId,
  children,
}: UnitContextProviderProps) {
  const { service, isInitializing } = useRuntimeMode();
  const [manifests, setManifests] = useState<ContentManifestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManifests = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const result = await service.getManifest({ semanticUnitId: unitId });
      if (result.success) {
        setManifests(result.data.manifests);
      } else {
        setError(result.error?.message ?? "Failed to fetch manifests");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [service, unitId]);

  useEffect(() => {
    if (!isInitializing && service) {
      fetchManifests();
    }
  }, [isInitializing, service, fetchManifests]);

  const value = useMemo<UnitContextValue>(
    () => ({
      unitId,
      manifests,
      loading: loading || isInitializing,
      error,
      refresh: fetchManifests,
    }),
    [unitId, manifests, loading, isInitializing, error, fetchManifests],
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit(): UnitContextValue {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    throw new Error("useUnit must be used within a UnitContextProvider");
  }
  return ctx;
}

/** Extract unique sources from manifests */
export function getUnitSources(manifests: ContentManifestEntry[]) {
  const seen = new Set<string>();
  return manifests.filter((m) => {
    if (seen.has(m.sourceId)) return false;
    seen.add(m.sourceId);
    return true;
  });
}

/** Extract projection info from manifests */
export function getUnitProjections(manifests: ContentManifestEntry[]) {
  return manifests
    .filter((m) => m.projectionId)
    .map((m) => ({
      projectionId: m.projectionId,
      sourceId: m.sourceId,
      status: m.status,
      chunksCount: m.chunksCount,
      dimensions: m.dimensions,
      model: m.model,
    }));
}

/** Derive overall status from manifest statuses */
export function getOverallStatus(
  manifests: ContentManifestEntry[],
): "complete" | "partial" | "failed" | "empty" {
  if (manifests.length === 0) return "empty";
  if (manifests.some((m) => m.status === "failed")) return "failed";
  if (manifests.every((m) => m.status === "complete")) return "complete";
  return "partial";
}

/** Derive current version info from latest manifest */
export function getCurrentVersion(manifests: ContentManifestEntry[]) {
  if (manifests.length === 0) return null;
  const sorted = [...manifests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted[0];
}
