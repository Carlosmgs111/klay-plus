import type { ContextRepository } from "../../domain/ContextRepository";
import type { Context } from "../../domain/Context";

export class ListContexts {
  constructor(private readonly _repository: ContextRepository) {}

  async execute(): Promise<Context[]> {
    return this._repository.findAll();
  }
}
