import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Icon } from "../../shared/Icon.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
import { SkeletonCard } from "../../shared/Skeleton.js";
import { SearchBar } from "./SearchBar.js";
import { SearchResults } from "./SearchResults.js";
import type { SearchKnowledgeInput } from "@klay/core";

export function SearchPage() {
  const { service, isInitializing } = useRuntimeMode();

  const searchAction = useCallback(
    (input: SearchKnowledgeInput) => service!.searchKnowledge(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(searchAction);

  const handleSearch = (queryText: string, topK: number, minScore: number) => {
    execute({ queryText, topK, minScore });
  };

  if (isInitializing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="search" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Semantic Search
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </CardBody>
      </Card>

      {error && <ErrorDisplay {...error} />}

      {isLoading && !data && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon name="layers" size={16} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Found <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{data.totalFound}</span> result{data.totalFound !== 1 ? "s" : ""} for "{data.queryText}"
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
    </div>
  );
}
