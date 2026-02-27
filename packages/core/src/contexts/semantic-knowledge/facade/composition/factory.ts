import type { SemanticUnitRepository } from "../../semantic-unit/domain/SemanticUnitRepository";
import type { KnowledgeLineageRepository } from "../../lineage/domain/KnowledgeLineageRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { SemanticUnitInfrastructurePolicy } from "../../semantic-unit/composition/factory";
import type { LineageInfrastructurePolicy } from "../../lineage/composition/factory";
import { resolveConfigProvider } from "../../../../platform/config/resolveConfigProvider";

interface SemanticUnitOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface LineageOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

export interface SemanticKnowledgeFacadePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  overrides?: {
    semanticUnit?: SemanticUnitOverrides;
    lineage?: LineageOverrides;
  };
  configOverrides?: Record<string, string>;
}

export interface ResolvedSemanticKnowledgeModules {
  semanticUnitRepository: SemanticUnitRepository;
  semanticUnitEventPublisher: EventPublisher;
  lineageRepository: KnowledgeLineageRepository;
  lineageEventPublisher: EventPublisher;
}

export async function resolveSemanticKnowledgeModules(
  policy: SemanticKnowledgeFacadePolicy,
): Promise<ResolvedSemanticKnowledgeModules> {
  const config = await resolveConfigProvider(policy);

  const semanticUnitPolicy: SemanticUnitInfrastructurePolicy = {
    provider: policy.overrides?.semanticUnit?.provider ?? policy.provider,
    dbPath:
      policy.overrides?.semanticUnit?.dbPath ??
      policy.dbPath ??
      config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName:
      policy.overrides?.semanticUnit?.dbName ??
      policy.dbName ??
      config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
  };

  const lineagePolicy: LineageInfrastructurePolicy = {
    provider: policy.overrides?.lineage?.provider ?? policy.provider,
    dbPath:
      policy.overrides?.lineage?.dbPath ??
      policy.dbPath ??
      config.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName:
      policy.overrides?.lineage?.dbName ??
      policy.dbName ??
      config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
  };

  const [semanticUnitResult, lineageResult] = await Promise.all([
    import("../../semantic-unit/composition/factory").then(
      (m) => m.semanticUnitFactory(semanticUnitPolicy),
    ),
    import("../../lineage/composition/factory").then((m) =>
      m.lineageFactory(lineagePolicy),
    ),
  ]);

  return {
    semanticUnitRepository: semanticUnitResult.infra.repository,
    semanticUnitEventPublisher: semanticUnitResult.infra.eventPublisher,
    lineageRepository: lineageResult.infra.repository,
    lineageEventPublisher: lineageResult.infra.eventPublisher,
  };
}
