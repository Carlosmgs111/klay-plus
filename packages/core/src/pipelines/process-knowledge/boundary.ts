/**
 * ProcessKnowledge — Boundary
 *
 * Error type and helpers for the pipeline workflow.
 * Replaces KnowledgeError with a plain serializable object.
 */

export interface PipelineError {
  step: string;
  code: string;
  message: string;
  completedSteps: string[];
}

export function pipelineError(
  step: string,
  error: unknown,
  completedSteps: string[],
): PipelineError {
  const normalizedStep = step.toUpperCase().replace(/-/g, "_");
  const message = extractMessage(error);
  return {
    step,
    code: `KNOWLEDGE_${normalizedStep}_FAILED`,
    message: message
      ? `Knowledge failed at ${step}: ${message}`
      : `Knowledge failed at ${step}`,
    completedSteps: [...completedSteps],
  };
}

export function extractMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error !== null &&
    error !== undefined &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return undefined;
}
