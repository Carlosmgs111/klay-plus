import type { SourceUseCases } from "../source/application/index.js";
import type { ExtractionUseCases } from "../extraction/application/index.js";
import type { SourceType } from "../source/domain/SourceType.js";

// ─── Composition ───────────────────────────────────────────────────
export { SourceIngestionOrchestratorComposer } from "./composition/SourceIngestionOrchestratorComposer.js";
export type {
  SourceIngestionOrchestratorPolicy,
  SourceIngestionInfraPolicy,
  ResolvedSourceIngestionModules,
} from "./composition/infra-policies.js";

import type { ResolvedSourceIngestionModules } from "./composition/infra-policies.js";

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrator for the Source Ingestion bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations for source registration and extraction.
 */
export class SourceIngestionOrchestrator {
  private readonly _source: SourceUseCases;
  private readonly _extraction: ExtractionUseCases;

  constructor(modules: ResolvedSourceIngestionModules) {
    this._source = modules.source;
    this._extraction = modules.extraction;
  }

  // ─── Module Accessors ─────────────────────────────────────────────────────

  get source(): SourceUseCases {
    return this._source;
  }

  get extraction(): ExtractionUseCases {
    return this._extraction;
  }

  // ─── Orchestrated Operations ──────────────────────────────────────────────

  /**
   * Registers a source and immediately triggers extraction.
   */
  async ingestSource(params: {
    id: string;
    name: string;
    uri: string;
    type: SourceType;
  }): Promise<{ sourceId: string }> {
    await this._source.registerSource.execute({
      id: params.id,
      name: params.name,
      type: params.type,
      uri: params.uri,
    });

    return { sourceId: params.id };
  }

  /**
   * Executes extraction for a registered source.
   */
  async extractSource(params: {
    jobId: string;
    sourceId: string;
  }): Promise<{ jobId: string }> {
    await this._extraction.executeExtraction.execute({
      jobId: params.jobId,
      sourceId: params.sourceId,
    });

    return { jobId: params.jobId };
  }

  /**
   * Registers a source and executes a separate extraction job.
   */
  async ingestAndExtract(params: {
    sourceId: string;
    sourceName: string;
    uri: string;
    type: SourceType;
    extractionJobId: string;
  }): Promise<{ sourceId: string; jobId: string }> {
    await this._source.registerSource.execute({
      id: params.sourceId,
      name: params.sourceName,
      type: params.type,
      uri: params.uri,
    });

    await this._extraction.executeExtraction.execute({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
    });

    return {
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
    };
  }

  /**
   * Batch ingestion of multiple sources.
   */
  async batchIngest(
    sources: Array<{
      id: string;
      name: string;
      uri: string;
      type: SourceType;
    }>,
  ): Promise<
    Array<{
      sourceId: string;
      success: boolean;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      sources.map((source) => this.ingestSource(source)),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          sourceId: result.value.sourceId,
          success: true,
        };
      }
      return {
        sourceId: sources[index].id,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    });
  }
}

// ─── Orchestrator Factory ──────────────────────────────────────────
import type { SourceIngestionOrchestratorPolicy } from "./composition/infra-policies.js";

export async function sourceIngestionOrchestratorFactory(
  policy: SourceIngestionOrchestratorPolicy,
): Promise<SourceIngestionOrchestrator> {
  const { SourceIngestionOrchestratorComposer } = await import(
    "./composition/SourceIngestionOrchestratorComposer.js"
  );
  const modules = await SourceIngestionOrchestratorComposer.resolve(policy);
  return new SourceIngestionOrchestrator(modules);
}
