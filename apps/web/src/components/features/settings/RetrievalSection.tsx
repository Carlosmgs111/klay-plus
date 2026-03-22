import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import type { RetrievalConfig } from "@klay/core/config";

const selectClass =
  "w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none";

const inputClass =
  "w-full rounded-lg border border-default bg-surface-2 px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none";

interface RetrievalSectionProps {
  value: RetrievalConfig;
  onChange: (config: RetrievalConfig) => void;
  runtimeMode: "browser" | "server" | "uninitialized";
}

export function RetrievalSection({ value, onChange, runtimeMode }: RetrievalSectionProps) {
  const ranking = value.ranking ?? "passthrough";
  const search = value.search ?? "dense";
  const mmrLambda = value.mmrLambda ?? 0.5;
  const crossEncoderModel = value.crossEncoderModel ?? "";

  const isBrowser = runtimeMode === "browser";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="search" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Retrieval</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          <p className="text-xs text-tertiary">
            Configure how knowledge is retrieved during semantic search. Ranking strategies
            and search modes can significantly affect result quality and diversity.
          </p>

          {/* Search mode — hidden in browser mode */}
          {!isBrowser && (
            <div className="rounded-lg border border-subtle bg-surface-2/50 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="layers" className="text-tertiary" />
                <label className="text-xs font-semibold text-secondary tracking-heading uppercase">
                  Search Mode
                </label>
              </div>
              <select
                value={search}
                onChange={(e) => onChange({ ...value, search: e.target.value as "dense" | "hybrid" })}
                className={selectClass}
              >
                <option value="dense">Dense — vector similarity only</option>
                <option value="hybrid">Hybrid — dense + sparse (BM25)</option>
              </select>
              <p className="text-xs text-tertiary">
                Hybrid search combines vector similarity with keyword matching. Only available
                in server mode.
              </p>
            </div>
          )}

          {/* Ranking */}
          <div className="rounded-lg border border-subtle bg-surface-2/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="sliders" className="text-tertiary" />
              <label className="text-xs font-semibold text-secondary tracking-heading uppercase">
                Ranking
              </label>
            </div>
            <select
              value={ranking}
              onChange={(e) =>
                onChange({ ...value, ranking: e.target.value as RetrievalConfig["ranking"] })
              }
              className={selectClass}
            >
              <option value="passthrough">None (passthrough)</option>
              <option value="mmr">MMR (diversity)</option>
              <option value="cross-encoder">Cross-encoder (reranking)</option>
            </select>

            {/* MMR Lambda — only when ranking === "mmr" */}
            {ranking === "mmr" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-secondary">
                    Diversity weight (λ)
                  </label>
                  <span className="text-xs font-mono text-accent">{mmrLambda.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={mmrLambda}
                  onChange={(e) =>
                    onChange({ ...value, mmrLambda: parseFloat(e.target.value) })
                  }
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-tertiary">
                  <span>More diversity</span>
                  <span>More relevance</span>
                </div>
              </div>
            )}

            {/* Cross-encoder model — only when ranking === "cross-encoder" */}
            {ranking === "cross-encoder" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-secondary">
                  Cross-encoder model
                </label>
                <input
                  type="text"
                  value={crossEncoderModel}
                  onChange={(e) => onChange({ ...value, crossEncoderModel: e.target.value })}
                  placeholder="cross-encoder/ms-marco-MiniLM-L-6-v2"
                  className={inputClass}
                />
                <p className="text-xs text-tertiary">
                  Any HuggingFace cross-encoder model ID
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
