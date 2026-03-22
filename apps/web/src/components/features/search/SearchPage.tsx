import { useCallback, useState } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { usePipelineAction } from "../../../hooks/usePipelineAction";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { SkeletonCard } from "../../shared/Skeleton";
import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";
import type { SearchKnowledgeInput } from "@klay/core";

export function SearchPage() {
  const { service, isInitializing } = useRuntimeMode();

  const searchAction = useCallback(
    (input: SearchKnowledgeInput) => service!.search(input),
    [service],
  );

  const { data, error, isLoading, execute } = usePipelineAction(searchAction);
  const [activeProfileFilter, setActiveProfileFilter] = useState<string>("");

  const handleSearch = (queryText: string, topK: number, minScore: number, filters?: Record<string, unknown>) => {
    setActiveProfileFilter((filters?.processingProfileId as string) ?? "");
    execute({ queryText, topK, minScore, filters });
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
            <Icon name="search" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
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
              <Icon name="layers" className="text-tertiary" />
              <p className="text-sm font-medium text-secondary">
                Found <span className="font-semibold text-primary">{data.totalFound}</span> result{data.totalFound !== 1 ? "s" : ""} for "{data.queryText}"
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
    </div>
  );
}
