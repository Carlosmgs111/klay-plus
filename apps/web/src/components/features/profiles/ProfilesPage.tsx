import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { CreateProfileForm } from "./CreateProfileForm";
import { ProfileList } from "./ProfileList";
import { ProfileEditForm } from "./ProfileEditForm";
import type { ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

export function ProfilesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setShowForm(false);
    setRefreshKey((k) => k + 1);
  };

  const handleEditSuccess = () => {
    setEditingProfile(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Create Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sliders" style={{ color: "var(--text-tertiary)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Processing Profiles
              </h2>
            </div>
            <Button
              className="text-lg flex items-center gap-2"
              variant={showForm ? "ghost" : "secondary"}
              onClick={() => setShowForm(!showForm)}
            >
              <Icon className="text-2xl" name={showForm ? "x" : "plus"} />
              {showForm ? "Close" : "New Profile"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardBody>
            <div className="animate-fade-in">
              <CreateProfileForm onSuccess={handleCreateSuccess} />
            </div>
          </CardBody>
        )}
      </Card>

      {/* Edit Profile (shown when editing) */}
      {editingProfile && (
        <Card>
          <CardBody>
            <div className="animate-fade-in">
              <ProfileEditForm
                profile={editingProfile}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingProfile(null)}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Profile List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="layers" style={{ color: "var(--text-tertiary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              All Profiles
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <ProfileList
            onEditProfile={setEditingProfile}
            refreshKey={refreshKey}
          />
        </CardBody>
      </Card>

      {/* About section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="info" style={{ color: "var(--text-tertiary)" }} />
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
