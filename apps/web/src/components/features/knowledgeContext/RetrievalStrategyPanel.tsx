import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";

export interface RetrievalOverride {
  ranking: "passthrough" | "mmr" | "cross-encoder";
  mmrLambda: number;         // [0, 1], only relevant when ranking=mmr
  crossEncoderModel: string; // only relevant when ranking=cross-encoder
}

export const DEFAULT_RETRIEVAL_OVERRIDE: RetrievalOverride = {
  ranking: "passthrough",
  mmrLambda: 0.5,
  crossEncoderModel: "cross-encoder/ms-marco-MiniLM-L-6-v2",
};

const CROSS_ENCODER_OPTIONS = [
  {
    value: "cross-encoder/ms-marco-MiniLM-L-6-v2",
    label: "MiniLM L-6 (fast)",
  },
  {
    value: "cross-encoder/ms-marco-MiniLM-L-12-v2",
    label: "MiniLM L-12 (accurate)",
  },
] as const;

interface RetrievalStrategyPanelProps {
  value: RetrievalOverride;
  onChange: (override: RetrievalOverride) => void;
  onReset: () => void;
}

export function RetrievalStrategyPanel({
  value,
  onChange,
  onReset,
}: RetrievalStrategyPanelProps) {
  const isCustom = value.ranking !== "passthrough";

  const handleRankingChange = (ranking: RetrievalOverride["ranking"]) => {
    onChange({ ...value, ranking });
  };

  const handleMmrLambdaChange = (mmrLambda: number) => {
    onChange({ ...value, mmrLambda });
  };

  const handleCrossEncoderModelChange = (crossEncoderModel: string) => {
    onChange({ ...value, crossEncoderModel });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="settings" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              Retrieval Strategy
            </h2>
            {isCustom && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-muted text-accent">
                Custom strategy active
              </span>
            )}
          </div>
          {isCustom && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-tertiary hover:text-secondary transition-colors duration-fast"
            >
              Reset
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Ranking selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-tertiary tracking-caps whitespace-nowrap">
              Ranking:
            </label>
            <select
              value={value.ranking}
              onChange={(e) =>
                handleRankingChange(e.target.value as RetrievalOverride["ranking"])
              }
              className="input text-xs py-1 flex-1"
            >
              <option value="passthrough">Default (no reranking)</option>
              <option value="mmr">MMR — diversity</option>
              <option value="cross-encoder">Cross-encoder</option>
            </select>
          </div>

          {/* MMR Lambda slider — only when ranking=mmr */}
          {value.ranking === "mmr" && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-tertiary tracking-caps whitespace-nowrap">
                λ = {value.mmrLambda.toFixed(2)}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.mmrLambda}
                onChange={(e) => handleMmrLambdaChange(Number(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span className="text-[10px] text-ghost whitespace-nowrap">
                0 = max diversity · 1 = max relevance
              </span>
            </div>
          )}

          {/* Cross-encoder model select — only when ranking=cross-encoder */}
          {value.ranking === "cross-encoder" && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-tertiary tracking-caps whitespace-nowrap">
                Model:
              </label>
              <select
                value={value.crossEncoderModel}
                onChange={(e) => handleCrossEncoderModelChange(e.target.value)}
                className="input text-xs py-1 flex-1"
              >
                {CROSS_ENCODER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
