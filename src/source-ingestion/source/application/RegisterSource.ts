import type { EventPublisher } from "../../../shared/domain/index.js";
import { Source } from "../domain/Source.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceType } from "../domain/SourceType.js";
import type { SourceRepository } from "../domain/SourceRepository.js";

export interface RegisterSourceCommand {
  id: string;
  name: string;
  type: SourceType;
  uri: string;
}

/**
 * Registers a new source reference.
 * Does NOT extract content - that's done by the extraction module.
 */
export class RegisterSource {
  constructor(
    private readonly repository: SourceRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterSourceCommand): Promise<void> {
    const sourceId = SourceId.create(command.id);

    const exists = await this.repository.exists(sourceId);
    if (exists) {
      throw new Error(`Source ${command.id} already exists`);
    }

    const source = Source.register(
      sourceId,
      command.name,
      command.type,
      command.uri,
    );

    await this.repository.save(source);
    await this.eventPublisher.publishAll(source.clearEvents());
  }
}
