import type { IngestAndExtract } from "../../contexts/source-ingestion/source/application/use-cases/IngestAndExtract";
import type { SourceQueries } from "../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { ContextQueries } from "../../contexts/context-management/context/application/use-cases/ContextQueries";
import type { ProjectionOperationsPort } from "../ports/ProjectionOperationsPort";
import type { AddSourceToContext } from "../../contexts/context-management/context/application/use-cases/AddSourceToContext";
import type { ProcessKnowledgeInput, ProcessKnowledgeSuccess } from "./dtos";
import type { SourceType } from "../../contexts/source-ingestion/source/domain/SourceType";
import type { ProjectionType } from "../../contexts/semantic-processing/projection/domain/ProjectionType";
import { Result } from "../../shared/domain/Result";
import { type PipelineError, pipelineError } from "./boundary";

const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

// ── Pipeline Context ──────────────────────────────────────────────────

export interface PipelineContext {
  input: ProcessKnowledgeInput;
  extractedText?: string;
  contentHash?: string;
  projectionId?: string;
  chunksCount?: number;
  dimensions?: number;
  model?: string;
  processingProfileId?: string;
  completedSteps: string[];
  resolvedContext?: {
    activeSources: Array<{ sourceId: string; projectionId?: string }>;
    allSources: Array<{ sourceId: string }>;
    currentVersion?: { version: number };
    requiredProfileId: string;
  };
}

// ── Steps ─────────────────────────────────────────────────────────────

export class IngestStep {
  constructor(
    private ingestAndExtract: IngestAndExtract,
    private sourceQueries: SourceQueries,
  ) {}

  shouldRun(ctx: PipelineContext): boolean {
    return !!ctx.input.sourceName;
  }

  async execute(ctx: PipelineContext): Promise<Result<PipelineError, PipelineContext>> {
    if (ctx.input.sourceName) {
      const ingestionResult = await this.ingestAndExtract.execute({
        sourceId: ctx.input.sourceId,
        sourceName: ctx.input.sourceName,
        uri: ctx.input.uri ?? "",
        type: (ctx.input.sourceType ?? "PLAIN_TEXT") as SourceType,
        extractionJobId: ctx.input.extractionJobId ?? crypto.randomUUID(),
        content: ctx.input.content,
      });

      if (ingestionResult.isFail()) {
        return Result.fail(
          pipelineError("ingestion", ingestionResult.error, ctx.completedSteps),
        );
      }

      return Result.ok({
        ...ctx,
        completedSteps: [...ctx.completedSteps, "ingestion"],
        extractedText: ingestionResult.value.extractedText,
        contentHash: ingestionResult.value.contentHash,
      });
    }

    // Existing source — verify it exists and load extracted text
    const source = await this.sourceQueries.getById(ctx.input.sourceId);
    if (!source) {
      return Result.fail(
        pipelineError(
          "ingestion",
          { message: `Source ${ctx.input.sourceId} not found`, code: "SOURCE_NOT_FOUND" },
          ctx.completedSteps,
        ),
      );
    }

    const textResult = await this.sourceQueries.getExtractedText(ctx.input.sourceId);
    const extractedText = textResult.isOk() ? textResult.value.text : undefined;

    return Result.ok({ ...ctx, extractedText });
  }
}

export class ProcessStep {
  constructor(private projectionOperations: ProjectionOperationsPort) {}

  shouldRun(ctx: PipelineContext): boolean {
    return !!(ctx.processingProfileId || ctx.input.contextId) && !!ctx.extractedText;
  }

  async execute(ctx: PipelineContext): Promise<Result<PipelineError, PipelineContext>> {
    let { projectionId, chunksCount, dimensions, model } = ctx;
    const completedSteps = [...ctx.completedSteps];

    // Check reuse of existing projection (when adding existing source to context)
    if (!ctx.input.sourceName && ctx.processingProfileId) {
      const existing = await this.projectionOperations.findExistingProjection(ctx.input.sourceId, ctx.processingProfileId);
      if (existing) {
        return Result.ok({
          ...ctx,
          projectionId: existing.projectionId,
          chunksCount: existing.chunksCount,
          dimensions: existing.dimensions,
          model: existing.model,
          completedSteps: [...completedSteps, "processing"],
        });
      }
    }

    // Validate profile
    if (!ctx.processingProfileId) {
      return Result.fail(
        pipelineError(
          "processing",
          { message: "No processing profile resolved", code: "PROFILE_NOT_FOUND" },
          completedSteps,
        ),
      );
    }

    // Cleanup existing projection for this profile (for reconciliation)
    if (!ctx.input.sourceName) {
      await this.projectionOperations.cleanupSourceProjectionForProfile(ctx.input.sourceId, ctx.processingProfileId);
    }

    if (!projectionId) {
      projectionId = crypto.randomUUID();
    }

    const processingResult = await this.projectionOperations.processContent({
      projectionId,
      sourceId: ctx.input.sourceId,
      content: ctx.extractedText!,
      type: (ctx.input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: ctx.processingProfileId,
    });

    if (processingResult.isFail()) {
      return Result.fail(
        pipelineError("processing", processingResult.error, completedSteps),
      );
    }

    return Result.ok({
      ...ctx,
      projectionId: processingResult.value.projectionId,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
      completedSteps: [...completedSteps, "processing"],
    });
  }
}

export class CatalogStep {
  constructor(private addSourceToContext: AddSourceToContext) {}

  shouldRun(ctx: PipelineContext): boolean {
    return !!ctx.input.contextId && !!ctx.resolvedContext;
  }

  async execute(ctx: PipelineContext): Promise<Result<PipelineError, PipelineContext>> {
    // Idempotent: skip addSource if already in context
    const alreadyInContext = ctx.resolvedContext!.allSources.some(
      (s) => s.sourceId === ctx.input.sourceId,
    );

    if (!alreadyInContext) {
      const addResult = await this.addSourceToContext.execute({
        contextId: ctx.input.contextId!,
        sourceId: ctx.input.sourceId,
        projectionId: ctx.projectionId,
      });

      if (addResult.isFail()) {
        return Result.fail(
          pipelineError("cataloging", addResult.error, ctx.completedSteps),
        );
      }
    }

    return Result.ok({
      ...ctx,
      completedSteps: [...ctx.completedSteps, "cataloging"],
    });
  }
}

// ── ProcessKnowledge Use Case ─────────────────────────────────────────

export class ProcessKnowledge {
  private ingest: IngestStep;
  private process: ProcessStep;
  private catalog: CatalogStep;
  private readonly _contextQueries: ContextQueries;

  constructor(deps: {
    ingestAndExtract: IngestAndExtract;
    sourceQueries: SourceQueries;
    projectionOperations: ProjectionOperationsPort;
    contextQueries: ContextQueries;
    addSourceToContext: AddSourceToContext;
  }) {
    this.ingest = new IngestStep(deps.ingestAndExtract, deps.sourceQueries);
    this.process = new ProcessStep(deps.projectionOperations);
    this.catalog = new CatalogStep(deps.addSourceToContext);
    this._contextQueries = deps.contextQueries;
  }

  async execute(
    input: ProcessKnowledgeInput,
  ): Promise<Result<PipelineError, ProcessKnowledgeSuccess>> {
    let ctx: PipelineContext = {
      input,
      completedSteps: [],
      projectionId: input.projectionId,
      processingProfileId: input.processingProfileId,
    };

    // ── Ingest (always runs — either ingests new or loads existing) ──
    const ingestResult = await this.ingest.execute(ctx);
    if (ingestResult.isFail()) return ingestResult as any;
    ctx = ingestResult.value;

    // ── Resolve context (if provided) and effective profile ──────────
    if (input.contextId) {
      const context = await this._contextQueries.getRaw(input.contextId);
      if (!context) {
        return Result.fail(
          pipelineError(
            "cataloging",
            { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" },
            ctx.completedSteps,
          ),
        );
      }
      if (context.requiredProfileId) {
        ctx.processingProfileId = context.requiredProfileId;
      }
      ctx.resolvedContext = {
        activeSources: [...context.activeSources],
        allSources: [...context.allSources],
        currentVersion: context.currentVersion!,
        requiredProfileId: context.requiredProfileId,
      };
    }

    // ── Process (if applicable) ─────────────────────────────────────
    if (this.process.shouldRun(ctx)) {
      const processResult = await this.process.execute(ctx);
      if (processResult.isFail()) return processResult as any;
      ctx = processResult.value;
    }

    // ── Catalog (if applicable) ─────────────────────────────────────
    if (this.catalog.shouldRun(ctx)) {
      const catalogResult = await this.catalog.execute(ctx);
      if (catalogResult.isFail()) return catalogResult as any;
      ctx = catalogResult.value;
    }

    // ── Build result ────────────────────────────────────────────────
    const needsProcessing = ctx.processingProfileId || input.contextId;
    const result: ProcessKnowledgeSuccess = {
      sourceId: input.sourceId,
      completedSteps: ctx.completedSteps,
      ...(ctx.contentHash && { contentHash: ctx.contentHash }),
      ...(ctx.extractedText && { extractedTextLength: ctx.extractedText.length }),
      ...(!needsProcessing && ctx.extractedText && { extractedText: ctx.extractedText }),
      ...(ctx.projectionId && { projectionId: ctx.projectionId }),
      ...(ctx.chunksCount !== undefined && { chunksCount: ctx.chunksCount }),
      ...(ctx.dimensions !== undefined && { dimensions: ctx.dimensions }),
      ...(ctx.model && { model: ctx.model }),
      ...(input.contextId && { contextId: input.contextId }),
    };

    return Result.ok(result);
  }
}
