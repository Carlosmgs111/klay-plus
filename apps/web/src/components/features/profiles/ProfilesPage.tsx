import { useState } from "react";
import { Card, CardHeader, CardBody } from "../../shared/Card";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { OverlayPanel } from "../../shared/OverlayPanel";
import { CreateProfileForm } from "./CreateProfileForm";
import { ProfileList } from "./ProfileList";
import { ProfileEditForm } from "./ProfileEditForm";
import type { ListProfilesResult } from "@klay/core";

type ProfileEntry = ListProfilesResult["profiles"][number];

export function ProfilesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  };

  const handleEditSuccess = () => {
    setEditingProfile(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Profile List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sliders" className="text-tertiary" />
              <h2 className="text-sm font-semibold text-primary tracking-heading">
                Processing Profiles
              </h2>
            </div>
            <Button
              className="text-lg flex items-center gap-2"
              variant="secondary"
              onClick={() => setShowCreate(true)}
            >
              <Icon className="text-2xl" name="plus" />
              New Profile
            </Button>
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
            <Icon name="info" className="text-tertiary" />
            <h2 className="text-sm font-semibold text-primary tracking-heading">
              About Processing Profiles
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-sm space-y-4 text-secondary">
            <p>
              A <strong className="text-primary">Processing Profile</strong> determines how documents are
              chunked and embedded during the semantic processing phase.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-lg bg-surface-1 border border-subtle">
                <h4 className="font-semibold text-xs uppercase mb-2 text-primary tracking-caps">
                  Chunking Strategies
                </h4>
                <ul className="text-xs space-y-1.5 text-tertiary">
                  <li>
                    <strong className="text-secondary">Recursive</strong> — Splits by paragraphs, then sentences
                  </li>
                  <li>
                    <strong className="text-secondary">Sentence</strong> — Splits at sentence boundaries
                  </li>
                  <li>
                    <strong className="text-secondary">Fixed Size</strong> — Splits at fixed character count
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-surface-1 border border-subtle">
                <h4 className="font-semibold text-xs uppercase mb-2 text-primary tracking-caps">
                  Embedding Strategies
                </h4>
                <ul className="text-xs space-y-1.5 text-tertiary">
                  <li>
                    <strong className="text-secondary">Hash</strong> — Deterministic, no API key required
                  </li>
                  <li>
                    <strong className="text-secondary">OpenAI</strong> — text-embedding-3-small via AI SDK
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Create Profile Overlay */}
      <OverlayPanel open={showCreate} setOpen={setShowCreate} icon="plus" title="New Profile">
        <CreateProfileForm onSuccess={handleCreateSuccess} />
      </OverlayPanel>

      {/* Edit Profile Overlay */}
      <OverlayPanel
        open={editingProfile !== null}
        setOpen={(v) => { if (!v) setEditingProfile(null); }}
        icon="edit"
        title="Edit Profile"
      >
        {editingProfile && (
          <ProfileEditForm
            profile={editingProfile}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingProfile(null)}
          />
        )}
      </OverlayPanel>
    </div>
  );
}
