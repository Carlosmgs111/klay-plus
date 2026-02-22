import type { PipelineStep } from "./PipelineStep.js";

/**
 * Error type for the Knowledge Pipeline orchestrator.
 *
 * Standalone error — does NOT extend DomainError from shared/.
 * The orchestrator is an application layer above bounded contexts,
 * and its error type has no dependency on context-level error hierarchies.
 *
 * Tracks which pipeline step failed and which steps completed successfully,
 * enabling callers to understand partial progress.
 */
export class KnowledgePipelineError extends Error {
  /** The pipeline step where the error occurred */
  readonly step: PipelineStep;

  /** Error code for programmatic handling */
  readonly code: string;

  /** Steps that completed successfully before the failure */
  readonly completedSteps: PipelineStep[];

  /** Error code from the original context error, if available */
  readonly originalCode?: string;

  /** Error message from the original context error, if available */
  readonly originalMessage?: string;

  constructor(params: {
    step: PipelineStep;
    code: string;
    message: string;
    completedSteps: PipelineStep[];
    originalCode?: string;
    originalMessage?: string;
  }) {
    super(params.message);
    this.name = "KnowledgePipelineError";
    this.step = params.step;
    this.code = params.code;
    this.completedSteps = params.completedSteps;
    this.originalCode = params.originalCode;
    this.originalMessage = params.originalMessage;
  }

  /**
   * Factory method to create a KnowledgePipelineError from a failed step.
   *
   * Extracts `code` and `message` from the original error if available,
   * treating it as `unknown` to avoid coupling to any specific error type.
   */
  static fromStep(
    step: PipelineStep,
    error: unknown,
    completedSteps: PipelineStep[],
  ): KnowledgePipelineError {
    const originalCode = extractCode(error);
    const originalMessage = extractMessage(error);

    return new KnowledgePipelineError({
      step,
      code: `PIPELINE_${step.toUpperCase()}_FAILED`,
      message: originalMessage
        ? `Pipeline failed at ${step}: ${originalMessage}`
        : `Pipeline failed at ${step}`,
      completedSteps: [...completedSteps],
      originalCode,
      originalMessage,
    });
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

// ─── Private Helpers ──────────────────────────────────────────────────────────

function extractCode(error: unknown): string | undefined {
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

function extractMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
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
