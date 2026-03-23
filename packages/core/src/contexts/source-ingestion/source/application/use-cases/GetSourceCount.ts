import type { SourceRepository } from "../../domain/SourceRepository";

export class GetSourceCount {
  constructor(
    private readonly sourceRepository: SourceRepository,
  ) {}

  async execute(): Promise<number> {
    return this.sourceRepository.count();
  }
}
