import type { SourceRepository } from "../../domain/SourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { Source } from "../../domain/Source";
import { SourceId } from "../../domain/SourceId";
import type { SourceType } from "../../domain/SourceType";
import {
  SourceAlreadyExistsError,
  SourceNameRequiredError,
  SourceUriRequiredError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface RegisterSourceInput {
  id: string;
  name: string;
  uri: string;
  type: SourceType;
}

export interface RegisterSourceSuccess {
  sourceId: string;
}

export class RegisterSource {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: RegisterSourceInput,
  ): Promise<Result<DomainError, RegisterSourceSuccess>> {
    if (!params.name || params.name.trim() === "") {
      return Result.fail(new SourceNameRequiredError());
    }
    if (!params.uri || params.uri.trim() === "") {
      return Result.fail(new SourceUriRequiredError());
    }

    const sourceId = SourceId.create(params.id);

    const exists = await this.sourceRepository.exists(sourceId);
    if (exists) {
      return Result.fail(new SourceAlreadyExistsError(params.uri));
    }

    const existingByUri = await this.sourceRepository.findByUri(params.uri);
    if (existingByUri) {
      return Result.fail(new SourceAlreadyExistsError(params.uri));
    }

    const source = Source.register(sourceId, params.name, params.type, params.uri);
    await this.sourceRepository.save(source);
    await this.eventPublisher.publishAll(source.clearEvents());

    return Result.ok({ sourceId: params.id });
  }
}
