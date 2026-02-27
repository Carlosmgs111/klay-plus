import type { SourceIngestionFacade } from "../../../contexts/source-ingestion/facade/SourceIngestionFacade";
import type { SemanticProcessingFacade } from "../../../contexts/semantic-processing/facade/SemanticProcessingFacade";
import type { SemanticKnowledgeFacade } from "../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade";
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
  ingestion: SourceIngestionFacade;
  knowledge: SemanticKnowledgeFacade;
  processing: SemanticProcessingFacade;
}

/**
 * KnowledgeManagementOrchestrator — Application Boundary.
 *
 * Implements KnowledgeManagementPort as the single public API for multi-step
 * lifecycle operations on existing semantic units.
 *
 * Receives 3 facades privately (ingestion + knowledge + processing).
 * Creates use cases internally (like the pipeline orchestrator).
 *
 * This is NOT a bounded context — it's an application layer that
 * coordinates existing bounded contexts via their facades.
 *
 * Rules:
 * - No facade getters — facades are private implementation details
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
