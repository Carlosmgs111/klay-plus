import { useState } from "react";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";

interface SearchBarProps {
  onSearch: (query: string, topK: number, minScore: number) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), topK, minScore);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="search" size={16} style={{ color: "var(--text-ghost)" }} />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base..."
            required
            className="input pl-9 py-2.5"
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Searching...
            </span>
          ) : (
            "Search"
          )}
        </Button>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Top K:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="input w-16 text-xs py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>Min Score:</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="input w-20 text-xs py-1"
          />
        </div>
      </div>
    </form>
  );
}
