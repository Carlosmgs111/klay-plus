import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext.js";
import { usePipelineAction } from "../../../hooks/usePipelineAction.js";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Spinner } from "../../shared/Spinner.js";
import { ErrorDisplay } from "../../shared/ErrorDisplay.js";
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Semantic Search
          </h2>
        </CardHeader>
        <CardBody>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </CardBody>
      </Card>

      {error && <ErrorDisplay {...error} />}

      {data && (
        <Card>
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
