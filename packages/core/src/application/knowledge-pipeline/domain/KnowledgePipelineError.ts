import { BaseOrchestratorError, extractCode, extractMessage } from "../../BaseOrchestratorError";
import type { PipelineStep } from "./PipelineStep";

export class KnowledgePipelineError extends BaseOrchestratorError<PipelineStep> {
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
}
