/**
 * StepError — Lightweight error object for use cases that track operation steps.
 *
 * Replaces KnowledgeError class with a plain serializable object.
 * Compatible with toRESTResponse() and unwrapResult() which access
 * error.step, error.code, and error.message.
 */

export interface StepError {
  step: string;
  code: string;
  message: string;
}

export function stepError(step: string, error: unknown): StepError {
  const normalizedStep = step.toUpperCase().replace(/-/g, "_");
  const message = extractMessage(error);
  return {
    step,
    code: `KNOWLEDGE_${normalizedStep}_FAILED`,
    message: message ?? `Operation failed at ${step}`,
  };
}

function extractMessage(error: unknown): string | undefined {
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
