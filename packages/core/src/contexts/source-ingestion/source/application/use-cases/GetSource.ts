import type { SourceRepository } from "../../domain/SourceRepository";
import type { Source } from "../../domain/Source";
import { SourceId } from "../../domain/SourceId";

export interface GetSourceInput {
  sourceId: string;
}

export class GetSource {
  constructor(
    private readonly sourceRepository: SourceRepository,
  ) {}

  async execute(params: GetSourceInput): Promise<Source | null> {
    return this.sourceRepository.findById(SourceId.create(params.sourceId));
  }
}
