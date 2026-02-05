import type { EventPublisher } from "../../../shared/domain/index.js";
import { Source } from "../domain/Source.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceType } from "../domain/SourceType.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import type { SourceExtractor } from "../domain/SourceExtractor.js";

export interface RegisterSourceCommand {
  id: string;
  name: string;
  type: SourceType;
  uri: string;
}

export class RegisterSource {
  constructor(
    private readonly repository: SourceRepository,
    private readonly extractor: SourceExtractor,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterSourceCommand): Promise<void> {
    const sourceId = SourceId.create(command.id);

    const exists = await this.repository.exists(sourceId);
    if (exists) {
      throw new Error(`Source ${command.id} already exists`);
    }

    const extraction = await this.extractor.extract(command.uri, command.type);

    const source = Source.register(
      sourceId,
      command.name,
      command.type,
      command.uri,
      extraction.rawContent,
      extraction.contentHash,
    );

    await this.repository.save(source);
    await this.eventPublisher.publishAll(source.clearEvents());
  }
}
