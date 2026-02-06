import { CreateSemanticUnit } from "./semantic-unit/application/CreateSemanticUnit.js";
import { VersionSemanticUnit } from "./semantic-unit/application/VersionSemanticUnit.js";
import { DeprecateSemanticUnit } from "./semantic-unit/application/DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./semantic-unit/application/ReprocessSemanticUnit.js";
import { RegisterTransformation } from "./lineage/application/RegisterTransformation.js";
import type { SemanticUnitRepository } from "./semantic-unit/domain/SemanticUnitRepository.js";
import type { KnowledgeLineageRepository } from "./lineage/domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../shared/domain/EventPublisher.js";

export class SemanticKnowledgeUseCases {
  readonly createSemanticUnit: CreateSemanticUnit;
  readonly versionSemanticUnit: VersionSemanticUnit;
  readonly deprecateSemanticUnit: DeprecateSemanticUnit;
  readonly reprocessSemanticUnit: ReprocessSemanticUnit;
  readonly registerTransformation: RegisterTransformation;

  constructor(
    semanticUnitRepository: SemanticUnitRepository,
    lineageRepository: KnowledgeLineageRepository,
    eventPublisher: EventPublisher,
  ) {
    this.createSemanticUnit = new CreateSemanticUnit(semanticUnitRepository, eventPublisher);
    this.versionSemanticUnit = new VersionSemanticUnit(semanticUnitRepository, eventPublisher);
    this.deprecateSemanticUnit = new DeprecateSemanticUnit(semanticUnitRepository, eventPublisher);
    this.reprocessSemanticUnit = new ReprocessSemanticUnit(semanticUnitRepository, eventPublisher);
    this.registerTransformation = new RegisterTransformation(lineageRepository, eventPublisher);
  }
}
