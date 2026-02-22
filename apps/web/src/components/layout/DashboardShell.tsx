import { lazy, Suspense } from "react";
import { RuntimeModeProvider } from "../../contexts/RuntimeModeContext.js";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { Spinner } from "../shared/Spinner.js";

const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage.js").then((m) => ({ default: m.DashboardPage })),
);
const DocumentsPage = lazy(() =>
  import("../features/documents/DocumentsPage.js").then((m) => ({ default: m.DocumentsPage })),
);
const KnowledgePage = lazy(() =>
  import("../features/knowledge/KnowledgePage.js").then((m) => ({ default: m.KnowledgePage })),
);
const SearchPage = lazy(() =>
  import("../features/search/SearchPage.js").then((m) => ({ default: m.SearchPage })),
);
const ProfilesPage = lazy(() =>
  import("../features/profiles/ProfilesPage.js").then((m) => ({ default: m.ProfilesPage })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage.js").then((m) => ({ default: m.SettingsPage })),
);

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  knowledge: "Knowledge Base",
  search: "Semantic Search",
  profiles: "Processing Profiles",
  settings: "Settings",
};

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  documents: DocumentsPage,
  knowledge: KnowledgePage,
  search: SearchPage,
  profiles: ProfilesPage,
  settings: SettingsPage,
};

interface DashboardShellProps {
  activePage: string;
}

export function DashboardShell({ activePage }: DashboardShellProps) {
  const title = PAGE_TITLES[activePage] ?? activePage;
  const PageComponent = PAGE_COMPONENTS[activePage];

  return (
    <RuntimeModeProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar activePage={activePage} />
        <Header title={title} />
        <main className="ml-sidebar mt-header p-6">
          {PageComponent ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" />
                </div>
              }
            >
              <PageComponent />
            </Suspense>
          ) : (
            <p className="text-gray-400">Page not found</p>
          )}
        </main>
      </div>
    </RuntimeModeProvider>
  );
}
