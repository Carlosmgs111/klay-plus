import type { EventPublisher } from "../../../../shared/domain/index.js";
import { LineageId } from "../domain/LineageId.js";
import { KnowledgeLineage } from "../domain/KnowledgeLineage.js";
import { Transformation, type TransformationType } from "../domain/Transformation.js";
import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";

export interface RegisterTransformationCommand {
  semanticUnitId: string;
  transformationType: TransformationType;
  strategyUsed: string;
  inputVersion: number;
  outputVersion: number;
  parameters?: Record<string, unknown>;
}

export class RegisterTransformation {
  constructor(
    private readonly repository: KnowledgeLineageRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterTransformationCommand): Promise<void> {
    let lineage = await this.repository.findBySemanticUnitId(command.semanticUnitId);

    if (!lineage) {
      const lineageId = LineageId.create(crypto.randomUUID());
      lineage = KnowledgeLineage.create(lineageId, command.semanticUnitId);
    }

    const transformation = Transformation.create(
      command.transformationType,
      command.strategyUsed,
      command.inputVersion,
      command.outputVersion,
      command.parameters ?? {},
    );

    lineage.registerTransformation(transformation);

    await this.repository.save(lineage);
    await this.eventPublisher.publishAll(lineage.clearEvents());
  }
}
