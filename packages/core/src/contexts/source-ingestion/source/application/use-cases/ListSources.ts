import type { SourceRepository } from "../../domain/SourceRepository";
import type { Source } from "../../domain/Source";

export class ListSources {
  constructor(
    private readonly sourceRepository: SourceRepository,
  ) {}

  async execute(): Promise<Source[]> {
    return this.sourceRepository.findAll();
  }
}
