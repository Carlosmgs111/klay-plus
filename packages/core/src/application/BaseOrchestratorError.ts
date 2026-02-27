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
