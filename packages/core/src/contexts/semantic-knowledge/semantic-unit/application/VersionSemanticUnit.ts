import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Meaning } from "../domain/Meaning.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";

export interface VersionSemanticUnitCommand {
  unitId: string;
  content: string;
  language: string;
  topics?: string[];
  summary?: string;
  reason: string;
}

export class VersionSemanticUnit {
  constructor(
    private readonly repository: SemanticUnitRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: VersionSemanticUnitCommand): Promise<void> {
    const unitId = SemanticUnitId.create(command.unitId);
    const unit = await this.repository.findById(unitId);

    if (!unit) {
      throw new Error(`SemanticUnit ${command.unitId} not found`);
    }

    const meaning = Meaning.create(
      command.content,
      command.language,
      command.topics ?? [],
      command.summary ?? null,
    );

    unit.addVersion(meaning, command.reason);

    await this.repository.save(unit);
    await this.eventPublisher.publishAll(unit.clearEvents());
  }
}
