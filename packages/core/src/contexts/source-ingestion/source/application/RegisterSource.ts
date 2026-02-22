import type { EventPublisher } from "../../../../shared/domain/index";
import { Result } from "../../../../shared/domain/Result";
import { Source } from "../domain/Source.js";
import { SourceId } from "../domain/SourceId.js";
import type { SourceType } from "../domain/SourceType.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import {
  SourceAlreadyExistsError,
  SourceNameRequiredError,
  SourceUriRequiredError,
  type SourceError,
} from "../domain/errors/index.js";

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

  async execute(command: RegisterSourceCommand): Promise<Result<SourceError, Source>> {
    // Validate required fields
    if (!command.name || command.name.trim() === "") {
      return Result.fail(new SourceNameRequiredError());
    }

    if (!command.uri || command.uri.trim() === "") {
      return Result.fail(new SourceUriRequiredError());
    }

    const sourceId = SourceId.create(command.id);

    // Check for duplicates
    const exists = await this.repository.exists(sourceId);
    if (exists) {
      return Result.fail(new SourceAlreadyExistsError(command.uri));
    }

    // Check if URI already registered
    const existingByUri = await this.repository.findByUri(command.uri);
    if (existingByUri) {
      return Result.fail(new SourceAlreadyExistsError(command.uri));
    }

    const source = Source.register(
      sourceId,
      command.name,
      command.type,
      command.uri,
    );

    await this.repository.save(source);
    await this.eventPublisher.publishAll(source.clearEvents());

    return Result.ok(source);
  }
}
