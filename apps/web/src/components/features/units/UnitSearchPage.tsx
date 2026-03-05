import { useCallback } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonCard } from "../../shared/Skeleton";
import { EmptyState } from "../../shared/EmptyState";
import { useUnit } from "../../../contexts/UnitContext";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { SearchBar } from "../search/SearchBar";
import { SearchResults } from "../search/SearchResults";
import type { SearchKnowledgeInput } from "@klay/core";

export default function UnitSearchPage() {
  const { unitId, loading: unitLoading, error: unitError } = useUnit();
  const { service, isInitializing } = useRuntimeMode();

  const searchAction = useCallback(
    (input: SearchKnowledgeInput) => service!.searchKnowledge(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(searchAction);

  const handleSearch = (queryText: string, topK: number, minScore: number) => {
    execute({
      queryText,
      topK,
      minScore,
      filters: { contextId: unitId },
    });
  };

  if (isInitializing || unitLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (unitError) {
    return (
      <div className="space-y-6">
        <ErrorDisplay message={unitError} code="UNIT_LOAD_ERROR" />
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
              Unit Search
            </h2>
            <span className="ml-2 text-xs px-2 py-0.5 rounded font-mono bg-surface-1 text-tertiary">
              scoped to {unitId.slice(0, 8)}...
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-xs mb-4 text-tertiary">
            Search across this unit's projections using semantic similarity.
          </p>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </CardBody>
      </Card>

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
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <SearchResults
              items={data.items}
              totalFound={data.totalFound}
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
              title="Search this unit"
              description="Enter a query above to find relevant content within this semantic unit's projections."
              icon="search"
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
