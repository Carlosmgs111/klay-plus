import { Result } from "../../shared/domain/Result";
import { KnowledgeError } from "./domain/KnowledgeError";
import { OperationStep } from "./domain/OperationStep";
import type { CreateContext } from "../../contexts/context-management/context/application/use-cases/CreateContext";
import type { TransitionContextState } from "../../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { CreateContextInput, CreateContextResult } from "./dtos";

/**
 * CreateContextAndActivate — orchestrates context creation + auto-activation.
 *
 * Creates a new Context aggregate in Draft state, then immediately transitions
 * it to Active for a low-friction UX. Wraps both steps in error handling.
 */
export class CreateContextAndActivate {
  constructor(
    private readonly createContext: CreateContext,
    private readonly transitionContextState: TransitionContextState,
  ) {}

  async execute(input: CreateContextInput): Promise<Result<KnowledgeError, CreateContextResult>> {
    try {
      const createResult = await this.createContext.execute({
        id: input.id,
        name: input.name,
        description: input.description,
        language: input.language,
        requiredProfileId: input.requiredProfileId,
        createdBy: input.createdBy,
        tags: input.tags,
        attributes: input.attributes,
      });

      if (createResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.CreateContext, createResult.error, []),
        );
      }

      // Auto-activate for low-friction UX (Draft -> Active)
      const activateResult = await this.transitionContextState.execute({
        contextId: createResult.value.id.value,
        action: "activate",
      });

      if (activateResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.ActivateContext, activateResult.error, []),
        );
      }

      return Result.ok({
        contextId: activateResult.value.id.value,
        state: activateResult.value.state,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.CreateContext, error, []),
      );
    }
  }
}
