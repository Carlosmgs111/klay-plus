import { BaseOrchestratorError, buildFromStepParams } from "../../BaseOrchestratorError";
import type { ManagementStep } from "./ManagementStep";

export class KnowledgeManagementError extends BaseOrchestratorError<ManagementStep> {
  static fromStep(
    step: ManagementStep,
    error: unknown,
    completedSteps: ManagementStep[],
  ): KnowledgeManagementError {
    return new KnowledgeManagementError(
      buildFromStepParams("MANAGEMENT", "Management", step, error, completedSteps),
    );
  }
}
