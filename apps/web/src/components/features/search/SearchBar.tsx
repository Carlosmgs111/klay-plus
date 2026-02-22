import { useState } from "react";
import { Input } from "../../shared/Input.js";
import { Button } from "../../shared/Button.js";

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
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base..."
            required
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Top K:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="input w-16 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Min Score:</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="input w-20 text-xs"
          />
        </div>
      </div>
    </form>
  );
}
