import type { ManagementStep } from "./ManagementStep.js";

/**
 * Error type for the Knowledge Management orchestrator.
 *
 * Standalone error — does NOT extend DomainError from shared/.
 * The management orchestrator is an application layer above bounded contexts,
 * and its error type has no dependency on context-level error hierarchies.
 *
 * Tracks which management step failed and which steps completed successfully,
 * enabling callers to understand partial progress. Mirrors KnowledgePipelineError.
 */
export class KnowledgeManagementError extends Error {
  /** The management step where the error occurred */
  readonly step: ManagementStep;

  /** Error code for programmatic handling */
  readonly code: string;

  /** Steps that completed successfully before the failure */
  readonly completedSteps: ManagementStep[];

  /** Error code from the original context error, if available */
  readonly originalCode?: string;

  /** Error message from the original context error, if available */
  readonly originalMessage?: string;

  constructor(params: {
    step: ManagementStep;
    code: string;
    message: string;
    completedSteps: ManagementStep[];
    originalCode?: string;
    originalMessage?: string;
  }) {
    super(params.message);
    this.name = "KnowledgeManagementError";
    this.step = params.step;
    this.code = params.code;
    this.completedSteps = params.completedSteps;
    this.originalCode = params.originalCode;
    this.originalMessage = params.originalMessage;
  }

  /**
   * Factory method to create a KnowledgeManagementError from a failed step.
   *
   * Extracts `code` and `message` from the original error if available,
   * treating it as `unknown` to avoid coupling to any specific error type.
   */
  static fromStep(
    step: ManagementStep,
    error: unknown,
    completedSteps: ManagementStep[],
  ): KnowledgeManagementError {
    const originalCode = extractCode(error);
    const originalMessage = extractMessage(error);

    const normalizedStep = step.toUpperCase().replace(/-/g, "_");

    return new KnowledgeManagementError({
      step,
      code: `MANAGEMENT_${normalizedStep}_FAILED`,
      message: originalMessage
        ? `Management failed at ${step}: ${originalMessage}`
        : `Management failed at ${step}`,
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

// --- Private Helpers ---

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
