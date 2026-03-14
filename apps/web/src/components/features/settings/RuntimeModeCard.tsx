import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";
import type { RuntimeMode } from "../../../services/types";

interface RuntimeModeCardProps {
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
}

export function RuntimeModeCard({ mode, setMode }: RuntimeModeCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="server" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Runtime Mode</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex gap-4">
          <button
            onClick={() => setMode("server")}
            className={`mode-card ${mode === "server" ? "mode-card-active-server" : ""}`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === "server" ? "bg-accent-muted" : "bg-surface-3"}`}>
                <Icon name="server" className={mode === "server" ? "text-accent" : "text-tertiary"} />
              </div>
              <h3 className={`font-semibold text-sm tracking-heading ${mode === "server" ? "text-accent" : "text-primary"}`}>
                Server Mode (SSR)
              </h3>
            </div>
            <p className="text-xs text-tertiary">Astro API routes + NeDB + OpenAI/Hash embeddings</p>
          </button>
          <button
            onClick={() => setMode("browser")}
            className={`mode-card ${mode === "browser" ? "mode-card-active-browser" : ""}`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === "browser" ? "bg-success-muted" : "bg-surface-3"}`}>
                <Icon name="globe" className={mode === "browser" ? "text-success" : "text-tertiary"} />
              </div>
              <h3 className={`font-semibold text-sm tracking-heading ${mode === "browser" ? "text-success" : "text-primary"}`}>
                Browser Mode
              </h3>
            </div>
            <p className="text-xs text-tertiary">Direct import + IndexedDB + WebLLM/Hash embeddings</p>
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
