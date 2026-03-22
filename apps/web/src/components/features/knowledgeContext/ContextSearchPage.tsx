import { useCallback, useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonCard } from "../../shared/Skeleton";
import { EmptyState } from "../../shared/EmptyState";
import { useKnowledgeContext } from "../../../contexts/KnowledgeContextContext";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { SearchBar } from "../search/SearchBar";
import { SearchResults } from "../search/SearchResults";
import { RetrievalStrategyPanel, DEFAULT_RETRIEVAL_OVERRIDE } from "./RetrievalStrategyPanel";
import type { RetrievalOverride } from "./RetrievalStrategyPanel";
import type { SearchKnowledgeInput } from "@klay/core";

export default function ContextSearchPage() {
  const { contextId, loading: contextLoading, error: contextError } = useKnowledgeContext();
  const { service, isInitializing } = useRuntimeMode();

  const searchAction = useCallback(
    (input: SearchKnowledgeInput) => service!.search(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(searchAction);
  const [activeProfileFilter, setActiveProfileFilter] = useState<string>("");
  const [retrievalOverride, setRetrievalOverride] = useState<RetrievalOverride>(DEFAULT_RETRIEVAL_OVERRIDE);

  const handleSearch = (queryText: string, topK: number, minScore: number, filters?: Record<string, unknown>) => {
    setActiveProfileFilter((filters?.processingProfileId as string) ?? "");
    const override = retrievalOverride.ranking !== "passthrough"
      ? {
          ranking: retrievalOverride.ranking,
          mmrLambda: retrievalOverride.mmrLambda,
          crossEncoderModel: retrievalOverride.crossEncoderModel,
        }
      : undefined;
    execute({
      queryText,
      topK,
      minScore,
      filters: { ...filters, contextId },
      ...(override !== undefined && { retrievalOverride: override }),
    });
  };

  if (isInitializing || contextLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="space-y-6">
        <ErrorDisplay message={contextError.message} code={contextError.code} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search input card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon
              name="search"
              className="text-tertiary"
            />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Context Search
            </h2>
            <span className="ml-2 text-xs px-2 py-0.5 rounded font-mono bg-surface-1 text-tertiary">
              scoped to {contextId.slice(0, 8)}...
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-xs mb-4 text-tertiary">
            Search across this context's projections using semantic similarity.
          </p>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} hideContextFilter />
        </CardBody>
      </Card>

      {/* Retrieval strategy override */}
      <RetrievalStrategyPanel
        value={retrievalOverride}
        onChange={setRetrievalOverride}
        onReset={() => setRetrievalOverride(DEFAULT_RETRIEVAL_OVERRIDE)}
      />

      {/* Error state */}
      {error && <ErrorDisplay {...error} />}

      {/* Loading skeleton for results */}
      {isLoading && !data && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon
                name="layers"
                className="text-tertiary"
              />
              <p className="text-sm font-medium text-secondary">
                Found{" "}
                <span className="font-semibold text-primary">
                  {data.totalFound}
                </span>{" "}
                result{data.totalFound !== 1 ? "s" : ""} for "{data.queryText}"
                {activeProfileFilter && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded font-medium bg-accent-muted text-accent">
                    profile: {activeProfileFilter}
                  </span>
                )}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <SearchResults
              items={data.items}
              queryText={data.queryText}
            />
          </CardBody>
        </Card>
      )}

      {/* Initial empty state (before any search) */}
      {!data && !isLoading && !error && (
        <Card>
          <CardBody>
            <EmptyState
              title="Search this context"
              description="Enter a query above to find relevant content within this context's projections."
              icon="search"
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
