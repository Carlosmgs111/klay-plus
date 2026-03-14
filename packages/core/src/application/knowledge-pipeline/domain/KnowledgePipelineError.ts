import { BaseOrchestratorError, buildFromStepParams } from "../../BaseOrchestratorError";
import type { PipelineStep } from "./PipelineStep";

export class KnowledgePipelineError extends BaseOrchestratorError<PipelineStep> {
  static fromStep(
    step: PipelineStep,
    error: unknown,
    completedSteps: PipelineStep[],
  ): KnowledgePipelineError {
    return new KnowledgePipelineError(
      buildFromStepParams("PIPELINE", "Pipeline", step, error, completedSteps),
    );
  }
}
