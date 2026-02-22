import { useState, useCallback } from "react";
import type { ServiceResult } from "../services/types.js";

interface PipelineActionState<T> {
  data: T | null;
  error: { message: string; code: string; step?: string; completedSteps?: string[] } | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<void>;
}

/**
 * Generic hook for pipeline actions.
 * Manages loading/success/error states automatically.
 *
 * @example
 * ```tsx
 * const service = usePipelineService();
 * const { data, error, isLoading, execute } = usePipelineAction(
 *   (input: SearchKnowledgeInput) => service.searchKnowledge(input)
 * );
 * ```
 */
export function usePipelineAction<T, TInput = void>(
  action: (input: TInput) => Promise<ServiceResult<T>>,
): PipelineActionState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PipelineActionState<T>["error"]>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(input);
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          console.error(result.error);
          setData(null);
          setError(result.error);
        }
      } catch (err) {
        console.error(err);
        setData(null);
        setError({
          message: err instanceof Error ? err.message : "Unexpected error",
          code: "UNEXPECTED_ERROR",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [action],
  );

  return { data, error, isLoading, execute };
}
