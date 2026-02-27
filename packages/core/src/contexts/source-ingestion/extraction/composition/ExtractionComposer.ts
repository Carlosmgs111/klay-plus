import type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExtractorMap,
} from "./infra-policies.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry.js";

/**
 * Supported MIME types for text-based extraction.
 */
const TEXT_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
] as const;

/**
 * Composer for the Extraction Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 *
 * Extractors are resolved separately (environment-based, not a registry concern).
 */
export class ExtractionComposer {

  private static async resolveExtractors(
    policy: ExtractionInfrastructurePolicy,
  ): Promise<ExtractorMap> {
    // Allow custom extractors override
    if (policy.customExtractors) {
      return policy.customExtractors;
    }

    const extractors: ExtractorMap = new Map();

    // Register text extractor for all text-based MIME types
    const { TextContentExtractor } = await import(
      "../infrastructure/adapters/TextContentExtractor.js"
    );
    const textExtractor = new TextContentExtractor();

    for (const mimeType of TEXT_MIME_TYPES) {
      extractors.set(mimeType, textExtractor);
    }

    // Register PDF extractor based on policy
    if (policy.provider === "browser") {
      const { BrowserPdfContentExtractor } = await import(
        "../infrastructure/adapters/BrowserPdfContentExtractor.js"
      );
      extractors.set("application/pdf", new BrowserPdfContentExtractor());
    } else {
      // "server" and "in-memory" use server-side PDF extraction
      const { ServerPdfContentExtractor } = await import(
        "../infrastructure/adapters/ServerPdfContentExtractor.js"
      );
      extractors.set("application/pdf", new ServerPdfContentExtractor());
    }

    return extractors;
  }

  static async resolve(
    policy: ExtractionInfrastructurePolicy,
    registries: {
      repository: ProviderRegistry<ExtractionJobRepository>;
      eventPublisher: ProviderRegistry<EventPublisher>;
    },
  ): Promise<ResolvedExtractionInfra> {
    const [repository, extractors, eventPublisher] = await Promise.all([
      registries.repository.resolve(policy.provider).create(policy),
      this.resolveExtractors(policy),
      registries.eventPublisher.resolve(policy.provider).create(policy),
    ]);

    return {
      repository,
      extractors,
      eventPublisher,
    };
  }
}
