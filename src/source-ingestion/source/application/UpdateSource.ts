import type { EventPublisher } from "../../../shared/domain/index.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceRepository } from "../domain/SourceRepository.js";

export interface UpdateSourceCommand {
  sourceId: string;
  contentHash: string;
}

/**
 * Records that content was extracted for a source.
 * Called by the facade after extraction completes.
 */
export class UpdateSource {
  constructor(
    private readonly repository: SourceRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateSourceCommand): Promise<boolean> {
    const sourceId = SourceId.create(command.sourceId);
    const source = await this.repository.findById(sourceId);

    if (!source) {
      throw new Error(`Source ${command.sourceId} not found`);
    }

    const changed = source.recordExtraction(command.contentHash);

    if (changed) {
      await this.repository.save(source);
      await this.eventPublisher.publishAll(source.clearEvents());
    }

    return changed;
  }
}
