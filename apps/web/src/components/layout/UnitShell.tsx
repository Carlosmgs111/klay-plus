import { lazy, Suspense } from "react";
import { ProviderStack } from "./ProviderStack";
import { UnitSidebar } from "./UnitSidebar";
import { Header } from "./Header";
import { ToastContainer } from "../shared/Toast";
import { SkeletonPage } from "../shared/Skeleton";
import { UnitContextProvider } from "../../contexts/UnitContext";

const UnitDashboardPage = lazy(
  () => import("../features/units/UnitDashboardPage")
);
const UnitSourcesPage = lazy(
  () => import("../features/units/UnitSourcesPage")
);
const UnitVersionsPage = lazy(
  () => import("../features/units/UnitVersionsPage")
);
const UnitProjectionsPage = lazy(
  () => import("../features/units/UnitProjectionsPage")
);
const UnitSearchPage = lazy(
  () => import("../features/units/UnitSearchPage")
);

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: UnitDashboardPage,
  sources: UnitSourcesPage,
  versions: UnitVersionsPage,
  projections: UnitProjectionsPage,
  search: UnitSearchPage,
};

interface UnitShellProps {
  unitId: string;
  activePage: string;
}

export function UnitShell({ unitId, activePage }: UnitShellProps) {
  const PageComponent = PAGE_COMPONENTS[activePage];
  const truncatedId =
    unitId.length > 8 ? `${unitId.slice(0, 8)}...` : unitId;

  return (
    <ProviderStack>
      <UnitContextProvider unitId={unitId}>
        <div className="h-screen flex flex-row w-full">
          <UnitSidebar unitId={unitId} activePage={activePage} />
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
                <p style={{ color: "var(--text-tertiary)" }}>
                  Page not found
                </p>
              )}
            </main>
          </div>
          <ToastContainer />
        </div>
      </UnitContextProvider>
    </ProviderStack>
  );
}
