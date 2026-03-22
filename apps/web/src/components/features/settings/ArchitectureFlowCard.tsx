import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Icon } from "../../shared/Icon";

interface ArchitectureFlowCardProps {
  mode: string;
}

const SERVER_FLOW = `React Component
  → useKnowledgeService()
  → ServerKnowledgeService.method(input)
  → fetch('/api/pipeline/...' | '/api/lifecycle/...')
  → Astro API Route
  → toRESTResponse(coordinator.method(body))
  → KnowledgeCoordinator
  → (NeDB + Hash/OpenAI embeddings)
  → Response JSON`;

const BROWSER_FLOW = `React Component
  → useKnowledgeService()
  → BrowserKnowledgeService.method(input)
  → dynamic import("@klay/core")
  → createKnowledgePlatform({ provider: "browser" })
  → unwrapResult(coordinator.method(input))
  → KnowledgeCoordinator
  → (IndexedDB + Hash/WebLLM embeddings)
  → UIResult<T>`;

export function ArchitectureFlowCard({ mode }: ArchitectureFlowCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="layers" className="text-tertiary" />
          <h2 className="text-sm font-semibold text-primary tracking-heading">Architecture Flow</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="font-mono text-xs rounded-lg p-5 overflow-x-auto leading-relaxed bg-code text-secondary border border-subtle">
          <pre>{mode === "server" ? SERVER_FLOW : BROWSER_FLOW}</pre>
        </div>
      </CardBody>
    </Card>
  );
}
