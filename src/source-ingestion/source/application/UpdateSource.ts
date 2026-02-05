import type { EventPublisher } from "../../../shared/domain/index.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import type { SourceExtractor } from "../domain/SourceExtractor.js";

export interface UpdateSourceCommand {
  sourceId: string;
}

export class UpdateSource {
  constructor(
    private readonly repository: SourceRepository,
    private readonly extractor: SourceExtractor,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateSourceCommand): Promise<boolean> {
    const sourceId = SourceId.create(command.sourceId);
    const source = await this.repository.findById(sourceId);

    if (!source) {
      throw new Error(`Source ${command.sourceId} not found`);
    }

    const extraction = await this.extractor.extract(source.uri, source.type);
    const changed = source.updateContent(extraction.rawContent, extraction.contentHash);

    if (changed) {
      await this.repository.save(source);
      await this.eventPublisher.publishAll(source.clearEvents());
    }

    return changed;
  }
}
