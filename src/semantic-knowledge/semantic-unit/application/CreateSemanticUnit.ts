import type { EventPublisher } from "../../../shared/domain/index.js";
import { SemanticUnit } from "../domain/SemanticUnit.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import { Origin } from "../domain/Origin.js";
import { Meaning } from "../domain/Meaning.js";
import { UnitMetadata } from "../domain/UnitMetadata.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface CreateSemanticUnitCommand {
  id: string;
  sourceId: string;
  sourceType: string;
  extractedAt: Date;
  content: string;
  language: string;
  topics?: string[];
  summary?: string;
  createdBy: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export class CreateSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateSemanticUnitCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.id);

    const exists = await this.repository.exists(unitId);
    if (exists) {
      throw new Error(`SemanticUnit ${command.id} already exists`);
    }

    const origin = Origin.create(command.sourceId, command.extractedAt, command.sourceType);
    const meaning = Meaning.create(
      command.content,
      command.language,
      command.topics ?? [],
      command.summary ?? null,
    );
    const metadata = UnitMetadata.create(
      command.createdBy,
      command.tags ?? [],
      command.attributes ?? {},
    );

    const unit = SemanticUnit.create(unitId, origin, meaning, metadata);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
