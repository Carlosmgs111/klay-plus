import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card.js";
import { CreateProfileForm } from "./CreateProfileForm.js";

export function ProfilesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Processing Profiles
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {showForm ? "Hide Form" : "New Profile"}
            </button>
          </div>
        </CardHeader>
        {showForm && (
          <CardBody>
            <CreateProfileForm onSuccess={() => setShowForm(false)} />
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            About Processing Profiles
          </h2>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-gray-600 space-y-3">
            <p>
              A <strong>Processing Profile</strong> determines how documents are
              chunked and embedded during the semantic processing phase.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Chunking Strategies
                </h4>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>
                    <strong>Recursive</strong> — Splits by paragraphs, then
                    sentences
                  </li>
                  <li>
                    <strong>Sentence</strong> — Splits at sentence boundaries
                  </li>
                  <li>
                    <strong>Fixed Size</strong> — Splits at fixed character count
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Embedding Strategies
                </h4>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>
                    <strong>Hash</strong> — Deterministic, no API key required
                  </li>
                  <li>
                    <strong>OpenAI</strong> — text-embedding-3-small via AI SDK
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
