import { BaseOrchestratorError, extractCode, extractMessage } from "../../BaseOrchestratorError";
import type { LifecycleStep } from "./LifecycleStep";

export class KnowledgeLifecycleError extends BaseOrchestratorError<LifecycleStep> {
  static fromStep(
    step: LifecycleStep,
    error: unknown,
    completedSteps: LifecycleStep[],
  ): KnowledgeLifecycleError {
    const originalCode = extractCode(error);
    const originalMessage = extractMessage(error);

    const normalizedStep = step.toUpperCase().replace(/-/g, "_");

    return new KnowledgeLifecycleError({
      step,
      code: `LIFECYCLE_${normalizedStep}_FAILED`,
      message: originalMessage
        ? `Lifecycle failed at ${step}: ${originalMessage}`
        : `Lifecycle failed at ${step}`,
      completedSteps: [...completedSteps],
      originalCode,
      originalMessage,
    });
  }
}
