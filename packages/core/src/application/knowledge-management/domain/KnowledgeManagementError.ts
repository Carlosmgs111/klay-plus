import { BaseOrchestratorError, extractCode, extractMessage } from "../../BaseOrchestratorError";
import type { ManagementStep } from "./ManagementStep";

export class KnowledgeManagementError extends BaseOrchestratorError<ManagementStep> {
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
}
