import { lazy, Suspense } from "react";
import { RuntimeModeProvider } from "../../contexts/RuntimeModeContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "../shared/Toast";
import { SkeletonPage } from "../shared/Skeleton";

const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  }))
);
const DocumentsPage = lazy(() =>
  import("../features/documents/DocumentsPage").then((m) => ({
    default: m.DocumentsPage,
  }))
);
const KnowledgePage = lazy(() =>
  import("../features/knowledge/KnowledgePage").then((m) => ({
    default: m.KnowledgePage,
  }))
);
const SearchPage = lazy(() =>
  import("../features/search/SearchPage").then((m) => ({
    default: m.SearchPage,
  }))
);
const ProfilesPage = lazy(() =>
  import("../features/profiles/ProfilesPage").then((m) => ({
    default: m.ProfilesPage,
  }))
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  }))
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
    <ThemeProvider>
      <ToastProvider>
        <RuntimeModeProvider>
          <div className="h-screen flex flex-row w-full">
            <Sidebar activePage={activePage} />
            <div className=" min-h-screen overflow-y-auto w-full">
              <Header title={title} />
              <main className="p-8 max-w-6xl mx-auto">
                {PageComponent ? (
                  <Suspense fallback={<SkeletonPage />}>
                    <div className="animate-fade-in max-w-6xl">
                      <PageComponent />
                    </div>
                  </Suspense>
                ) : (
                  <p style={{ color: "var(--text-tertiary)" }}>
                    Page not found
                  </p>
                )}
              </main>
            </div>
            <ToastContainer />
          </div>
        </RuntimeModeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
