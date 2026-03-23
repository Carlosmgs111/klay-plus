import type { ContextRepository } from "../../domain/ContextRepository";
import type { Context } from "../../domain/Context";
import { ContextId } from "../../domain/ContextId";

export class GetContext {
  constructor(private readonly _repository: ContextRepository) {}

  async execute(input: { contextId: string }): Promise<Context | null> {
    return this._repository.findById(ContextId.create(input.contextId));
  }
}
