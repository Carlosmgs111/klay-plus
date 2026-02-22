import type { EventPublisher } from "../../../../shared/domain/index";
import { Result } from "../../../../shared/domain/Result";
import type { Source } from "../domain/Source.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import { SourceNotFoundError, type SourceError } from "../domain/errors/index.js";

export interface UpdateSourceCommand {
  sourceId: string;
  contentHash: string;
}

export interface UpdateSourceResult {
  source: Source;
  changed: boolean;
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

  async execute(command: UpdateSourceCommand): Promise<Result<SourceError, UpdateSourceResult>> {
    const sourceId = SourceId.create(command.sourceId);
    const source = await this.repository.findById(sourceId);

    if (!source) {
      return Result.fail(new SourceNotFoundError(command.sourceId));
    }

    const changed = source.recordExtraction(command.contentHash);

    if (changed) {
      await this.repository.save(source);
      await this.eventPublisher.publishAll(source.clearEvents());
    }

    return Result.ok({ source, changed });
  }
}
