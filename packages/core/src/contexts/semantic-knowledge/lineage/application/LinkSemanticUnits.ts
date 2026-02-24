import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import { LineageId } from "../domain/LineageId.js";
import { KnowledgeLineage } from "../domain/KnowledgeLineage.js";
import { Trace } from "../domain/Trace.js";
import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";

export interface LinkSemanticUnitsCommand {
  fromUnitId: string;
  toUnitId: string;
  relationship: string;
}

export class LinkSemanticUnits {
  constructor(
    private readonly repository: KnowledgeLineageRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: LinkSemanticUnitsCommand): Promise<void> {
    if (command.fromUnitId === command.toUnitId) {
      throw new Error("Cannot link a semantic unit to itself");
    }

    let lineage = await this.repository.findBySemanticUnitId(command.fromUnitId);

    if (!lineage) {
      const lineageId = LineageId.create(crypto.randomUUID());
      lineage = KnowledgeLineage.create(lineageId, command.fromUnitId);
    }

    const duplicate = lineage.traces.some(
      (t) =>
        t.fromUnitId === command.fromUnitId &&
        t.toUnitId === command.toUnitId &&
        t.relationship === command.relationship,
    );

    if (duplicate) {
      throw new Error(
        `Link already exists: ${command.fromUnitId} --[${command.relationship}]--> ${command.toUnitId}`,
      );
    }

    const trace = Trace.create(
      command.fromUnitId,
      command.toUnitId,
      command.relationship,
    );

    lineage.addTrace(trace);

    await this.repository.save(lineage);
    await this.eventPublisher.publishAll(lineage.clearEvents());
  }
}
