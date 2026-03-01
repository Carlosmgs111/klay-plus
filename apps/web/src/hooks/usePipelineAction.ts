import { useState, useCallback } from "react";
import type { ServiceResult } from "../services/types";

interface ServiceActionState<T> {
  data: T | null;
  error: { message: string; code: string; step?: string; completedSteps?: string[] } | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<T | null>;
}

/**
 * Generic hook for service actions (pipeline, lifecycle, or any ServiceResult-based call).
 * Manages loading/success/error states automatically.
 * Returns the data from execute() for inline usage (e.g. toast notifications).
 *
 * @example
 * ```tsx
 * // Pipeline usage:
 * const service = usePipelineService();
 * const { data, error, isLoading, execute } = usePipelineAction(
 *   (input: SearchKnowledgeInput) => service.searchKnowledge(input)
 * );
 *
 * // Lifecycle usage:
 * const lifecycle = useLifecycleService();
 * const { execute: removeSource } = useServiceAction(
 *   (input: RemoveSourceInput) => lifecycle.removeSource(input)
 * );
 * ```
 */
export function useServiceAction<T, TInput = void>(
  action: (input: TInput) => Promise<ServiceResult<T>>,
): ServiceActionState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ServiceActionState<T>["error"]>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (input: TInput): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(input);
        if (result.success) {
          setData(result.data);
          setError(null);
          return result.data;
        } else {
          console.error(result.error);
          setData(null);
          setError(result.error);
          return null;
        }
      } catch (err) {
        console.error(err);
        setData(null);
        setError({
          message: err instanceof Error ? err.message : "Unexpected error",
          code: "UNEXPECTED_ERROR",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [action],
  );

  return { data, error, isLoading, execute };
}

/**
 * Alias for useServiceAction — kept for backward compatibility.
 * New code should prefer useServiceAction.
 */
export const usePipelineAction = useServiceAction;
