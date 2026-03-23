import type { ContextRepository } from "../../domain/ContextRepository";
import type { Context } from "../../domain/Context";

export class GetContextsForSource {
  constructor(private readonly _repository: ContextRepository) {}

  async execute(input: { sourceId: string }): Promise<Context[]> {
    return this._repository.findBySourceId(input.sourceId);
  }
}
