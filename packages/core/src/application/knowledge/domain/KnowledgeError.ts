import type { OperationStep } from "./OperationStep";

export class KnowledgeError extends Error {
  readonly step: OperationStep;
  readonly code: string;
  readonly completedSteps: OperationStep[];
  readonly originalCode?: string;
  readonly originalMessage?: string;

  constructor(params: {
    step: OperationStep;
    code: string;
    message: string;
    completedSteps: OperationStep[];
    originalCode?: string;
    originalMessage?: string;
  }) {
    super(params.message);
    this.name = "KnowledgeError";
    this.step = params.step;
    this.code = params.code;
    this.completedSteps = params.completedSteps;
    this.originalCode = params.originalCode;
    this.originalMessage = params.originalMessage;
  }

  static fromStep(
    step: OperationStep,
    error: unknown,
    completedSteps: OperationStep[],
  ): KnowledgeError {
    const originalCode = extractCode(error);
    const originalMessage = extractMessage(error);
    const normalizedStep = step.toUpperCase().replace(/-/g, "_");

    return new KnowledgeError({
      step,
      code: `KNOWLEDGE_${normalizedStep}_FAILED`,
      message: originalMessage
        ? `Knowledge failed at ${step}: ${originalMessage}`
        : `Knowledge failed at ${step}`,
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
