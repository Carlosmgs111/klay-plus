import { SearchResultCard } from "./SearchResultCard.js";
import { EmptyState } from "../../shared/EmptyState.js";

interface SearchItem {
  semanticUnitId: string;
  content: string;
  score: number;
  version: number;
  metadata: Record<string, unknown>;
}

interface SearchResultsProps {
  items: SearchItem[];
  totalFound: number;
  queryText: string;
}

export function SearchResults({ items, totalFound, queryText }: SearchResultsProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description={`No matches for "${queryText}". Try a different query.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Found {totalFound} result{totalFound !== 1 ? "s" : ""} for "{queryText}"
      </p>
      {items.map((item, idx) => (
        <SearchResultCard
          key={`${item.semanticUnitId}-${idx}`}
          content={item.content}
          score={item.score}
          semanticUnitId={item.semanticUnitId}
          metadata={item.metadata}
        />
      ))}
    </div>
  );
}
