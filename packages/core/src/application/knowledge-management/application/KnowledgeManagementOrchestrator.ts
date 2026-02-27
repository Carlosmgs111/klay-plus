import type { SourceIngestionService } from "../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SemanticKnowledgeService } from "../../../contexts/semantic-knowledge/service/SemanticKnowledgeService";
import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "../contracts/dtos";
import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeManagementError } from "../domain/KnowledgeManagementError";
import { IngestAndAddSource } from "./use-cases/IngestAndAddSource";

/**
 * Resolved dependencies for the KnowledgeManagementOrchestrator.
 * Created by the Composer — not read from policy.
 */
export interface ResolvedManagementDependencies {
  ingestion: SourceIngestionService;
  knowledge: SemanticKnowledgeService;
  processing: SemanticProcessingService;
}

/**
 * KnowledgeManagementOrchestrator — Application Boundary.
 *
 * Implements KnowledgeManagementPort as the single public API for multi-step
 * lifecycle operations on existing semantic units.
 *
 * Receives 3 services privately (ingestion + knowledge + processing).
 * Creates use cases internally (like the pipeline orchestrator).
 *
 * This is NOT a bounded context — it's an application layer that
 * coordinates existing bounded contexts via their services.
 *
 * Rules:
 * - No service getters — services are private implementation details
 * - No policy reading — the Composer handles infrastructure selection
 * - No domain logic — only delegation to use cases
 * - No framework dependencies — pure TypeScript
 */
export class KnowledgeManagementOrchestrator implements KnowledgeManagementPort {
  private readonly _ingestAndAddSource: IngestAndAddSource;

  constructor(deps: ResolvedManagementDependencies) {
    this._ingestAndAddSource = new IngestAndAddSource(
      deps.ingestion,
      deps.knowledge,
      deps.processing,
    );
  }

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>> {
    return this._ingestAndAddSource.execute(input);
  }
}
