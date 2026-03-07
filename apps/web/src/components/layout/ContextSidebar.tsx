import { Icon } from "../shared/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import type { IconName } from "../shared/Icon";

const UNIT_NAV_ITEMS: { label: string; page: string; icon: IconName }[] = [
  { label: "Dashboard", page: "dashboard", icon: "layout-dashboard" },
  { label: "Sources", page: "sources", icon: "database" },
  { label: "Versions", page: "versions", icon: "clock" },
  { label: "Projections", page: "projections", icon: "layers" },
  { label: "Search", page: "search", icon: "search" },
];

interface ContextSidebarProps {
  contextId: string;
  activePage: string;
}

export function ContextSidebar({ contextId, activePage }: ContextSidebarProps) {
  const { resolved, toggleTheme } = useTheme();
  const truncatedId = contextId.length > 8 ? `${contextId.slice(0, 8)}...` : contextId;

  return (
    <aside className="sticky left-0 top-0 bottom-0 flex flex-col z-10 bg-surface-1 border-r border-default">
      {/* Back + Unit ID */}
      <div className="h-header flex flex-col justify-center px-3 py-4 border-b border-default">
        <a
          href="/contexts"
          className="flex items-center gap-1 text-sm text-tertiary hover:text-primary transition-all duration-fast ease-out-expo mb-1"
        >
          <Icon name="arrow-left" className="text-xs" />
          All Contexts
        </a>
        <span
          className="text-sm font-mono text-secondary"
          title={contextId}
        >
          {truncatedId}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-2 overflow-y-auto">
        {UNIT_NAV_ITEMS.map((item) => {
          const isActive = activePage === item.page;
          const href = `/contexts/${contextId}/${item.page}`;
          return (
            <a
              key={item.page}
              href={href}
              className={`sidebar-item text-lg ${isActive ? "sidebar-item-active" : ""}`}
            >
              <Icon name={item.icon} className="flex-shrink-0 mr-2" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-subtle">
        <span className="text-xs text-tertiary">
          klay+ v0.1
        </span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-3 transition-all duration-fast ease-out-expo"
          aria-label="Toggle theme"
        >
          <Icon
            name={resolved === "dark" ? "sun" : "moon"}
            className="text-xl"
          />
        </button>
      </div>
    </aside>
  );
}
