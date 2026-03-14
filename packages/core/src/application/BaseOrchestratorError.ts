export abstract class BaseOrchestratorError<TStep extends string> extends Error {
  readonly step: TStep;
  readonly code: string;
  readonly completedSteps: TStep[];
  readonly originalCode?: string;
  readonly originalMessage?: string;

  constructor(params: {
    step: TStep;
    code: string;
    message: string;
    completedSteps: TStep[];
    originalCode?: string;
    originalMessage?: string;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.step = params.step;
    this.code = params.code;
    this.completedSteps = params.completedSteps;
    this.originalCode = params.originalCode;
    this.originalMessage = params.originalMessage;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      step: this.step,
      code: this.code,
      completedSteps: this.completedSteps,
      originalCode: this.originalCode,
      originalMessage: this.originalMessage,
    };
  }
}

/**
 * Builds the constructor params for an orchestrator error from a failed step.
 *
 * Shared by all 3 orchestrator error subclasses (Pipeline, Management, Lifecycle).
 * Each subclass calls this in its one-liner `fromStep()` static method.
 *
 * @param prefix  - Code prefix, e.g. "PIPELINE", "MANAGEMENT", "LIFECYCLE"
 * @param label   - Human-readable label for messages, e.g. "Pipeline", "Management", "Lifecycle"
 * @param step    - The step that failed
 * @param error   - The original error (unknown type)
 * @param completedSteps - Steps completed before the failure
 */
export function buildFromStepParams<TStep extends string>(
  prefix: string,
  label: string,
  step: TStep,
  error: unknown,
  completedSteps: TStep[],
): {
  step: TStep;
  code: string;
  message: string;
  completedSteps: TStep[];
  originalCode?: string;
  originalMessage?: string;
} {
  const originalCode = extractCode(error);
  const originalMessage = extractMessage(error);
  const normalizedStep = step.toUpperCase().replace(/-/g, "_");

  return {
    step,
    code: `${prefix}_${normalizedStep}_FAILED`,
    message: originalMessage
      ? `${label} failed at ${step}: ${originalMessage}`
      : `${label} failed at ${step}`,
    completedSteps: [...completedSteps],
    originalCode,
    originalMessage,
  };
}

export function extractCode(error: unknown): string | undefined {
  if (
    error !== null &&
    error !== undefined &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  ) {
    return (error as Record<string, unknown>).code as string;
  }
  return undefined;
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
