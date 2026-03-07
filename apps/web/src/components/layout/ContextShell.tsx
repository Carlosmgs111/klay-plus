import { lazy, Suspense } from "react";
import { ProviderStack } from "./ProviderStack";
import { ContextSidebar } from "./ContextSidebar";
import { Header } from "./Header";
import { ToastContainer } from "../shared/Toast";
import { SkeletonPage } from "../shared/Skeleton";
import { KnowledgeContextProvider } from "../../contexts/KnowledgeContextContext";

const ContextDashboardPage = lazy(
  () => import("../features/knowledgeContext/ContextDashboardPage")
);
const ContextSourcesPage = lazy(
  () => import("../features/knowledgeContext/ContextSourcesPage")
);
const ContextVersionsPage = lazy(
  () => import("../features/knowledgeContext/ContextVersionsPage")
);
const ContextProjectionsPage = lazy(
  () => import("../features/knowledgeContext/ContextProjectionsPage")
);
const ContextSearchPage = lazy(
  () => import("../features/knowledgeContext/ContextSearchPage")
);

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: ContextDashboardPage,
  sources: ContextSourcesPage,
  versions: ContextVersionsPage,
  projections: ContextProjectionsPage,
  search: ContextSearchPage,
};

interface ContextShellProps {
  contextId: string;
  activePage: string;
}

export function ContextShell({ contextId, activePage }: ContextShellProps) {
  const PageComponent = PAGE_COMPONENTS[activePage];
  const truncatedId =
    contextId.length > 8 ? `${contextId.slice(0, 8)}...` : contextId;

  return (
    <ProviderStack>
      <KnowledgeContextProvider contextId={contextId}>
        <div className="h-screen flex flex-row w-full">
          <ContextSidebar contextId={contextId} activePage={activePage} />
          <div className="min-h-screen overflow-y-auto w-full">
            <Header
              title={truncatedId}
              breadcrumbs={[
                { label: "Knowledge", href: "/knowledge" },
                { label: truncatedId },
              ]}
            />
            <main className="p-8 max-w-6xl mx-auto">
              {PageComponent ? (
                <Suspense fallback={<SkeletonPage />}>
                  <div className="animate-fade-in max-w-6xl">
                    <PageComponent />
                  </div>
                </Suspense>
              ) : (
                <p className="text-tertiary">
                  Page not found
                </p>
              )}
            </main>
          </div>
          <ToastContainer />
        </div>
      </KnowledgeContextProvider>
    </ProviderStack>
  );
}
