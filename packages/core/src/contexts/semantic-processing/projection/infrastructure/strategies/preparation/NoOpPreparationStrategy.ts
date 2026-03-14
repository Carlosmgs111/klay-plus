import type { PreparationStrategy } from "../../../domain/ports/PreparationStrategy";

export class NoOpPreparationStrategy implements PreparationStrategy {
  readonly strategyId = "none";
  readonly version = 1;

  async prepare(content: string): Promise<string> {
    return content;
  }
}
