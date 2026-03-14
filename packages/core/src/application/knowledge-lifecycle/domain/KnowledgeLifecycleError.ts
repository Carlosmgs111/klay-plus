import { BaseOrchestratorError, buildFromStepParams } from "../../BaseOrchestratorError";
import type { LifecycleStep } from "./LifecycleStep";

export class KnowledgeLifecycleError extends BaseOrchestratorError<LifecycleStep> {
  static fromStep(
    step: LifecycleStep,
    error: unknown,
    completedSteps: LifecycleStep[],
  ): KnowledgeLifecycleError {
    return new KnowledgeLifecycleError(
      buildFromStepParams("LIFECYCLE", "Lifecycle", step, error, completedSteps),
    );
  }
}
