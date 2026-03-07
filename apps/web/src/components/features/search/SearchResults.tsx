import { SearchResultCard } from "./SearchResultCard";
import { EmptyState } from "../../shared/EmptyState";

interface SearchItem {
  sourceId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface SearchResultsProps {
  items: SearchItem[];
  totalFound: number;
  queryText: string;
}

export function SearchResults({ items, queryText }: SearchResultsProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description={`No matches for "${queryText}". Try a different query.`}
        icon="search"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <SearchResultCard
          key={`${item.sourceId}-${idx}`}
          content={item.content}
          score={item.score}
          sourceId={item.sourceId}
          metadata={item.metadata}
          rank={idx + 1}
        />
      ))}
    </div>
  );
}
