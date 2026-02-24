import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { Button } from "../../shared/Button.js";
import { Icon } from "../../shared/Icon.js";
import { CreateProfileForm } from "./CreateProfileForm.js";

export function ProfilesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sliders" size={16} style={{ color: "var(--text-tertiary)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Processing Profiles
              </h2>
            </div>
            <Button
              variant={showForm ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Icon name={showForm ? "x" : "plus"} size={14} />
              {showForm ? "Close" : "New Profile"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardBody>
            <div className="animate-fade-in">
              <CreateProfileForm onSuccess={() => setShowForm(false)} />
            </div>
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="info" size={16} style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              About Processing Profiles
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-sm space-y-4" style={{ color: "var(--text-secondary)" }}>
            <p>
              A <strong style={{ color: "var(--text-primary)" }}>Processing Profile</strong> determines how documents are
              chunked and embedded during the semantic processing phase.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <h4
                  className="font-semibold text-xs uppercase mb-2"
                  style={{ color: "var(--text-primary)", letterSpacing: "0.06em" }}
                >
                  Chunking Strategies
                </h4>
                <ul className="text-xs space-y-1.5" style={{ color: "var(--text-tertiary)" }}>
                  <li>
                    <strong style={{ color: "var(--text-secondary)" }}>Recursive</strong> — Splits by paragraphs, then sentences
                  </li>
                  <li>
                    <strong style={{ color: "var(--text-secondary)" }}>Sentence</strong> — Splits at sentence boundaries
                  </li>
                  <li>
                    <strong style={{ color: "var(--text-secondary)" }}>Fixed Size</strong> — Splits at fixed character count
                  </li>
                </ul>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <h4
                  className="font-semibold text-xs uppercase mb-2"
                  style={{ color: "var(--text-primary)", letterSpacing: "0.06em" }}
                >
                  Embedding Strategies
                </h4>
                <ul className="text-xs space-y-1.5" style={{ color: "var(--text-tertiary)" }}>
                  <li>
                    <strong style={{ color: "var(--text-secondary)" }}>Hash</strong> — Deterministic, no API key required
                  </li>
                  <li>
                    <strong style={{ color: "var(--text-secondary)" }}>OpenAI</strong> — text-embedding-3-small via AI SDK
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
