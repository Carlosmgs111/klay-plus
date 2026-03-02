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

interface UnitSidebarProps {
  unitId: string;
  activePage: string;
}

export function UnitSidebar({ unitId, activePage }: UnitSidebarProps) {
  const { resolved, toggleTheme } = useTheme();
  const truncatedId = unitId.length > 8 ? `${unitId.slice(0, 8)}...` : unitId;

  return (
    <aside className="sticky left-0 top-0 bottom-0 flex flex-col z-10 bg-slate-200/40 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
      {/* Back + Unit ID */}
      <div className="h-header flex flex-col justify-center px-3 py-4 border-b border-slate-200 dark:border-slate-800">
        <a
          href="/knowledge"
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-150 mb-1"
        >
          <Icon name="arrow-left" className="text-xs" />
          All Units
        </a>
        <span
          className="text-sm font-mono"
          style={{ color: "var(--text-secondary)" }}
          title={unitId}
        >
          {truncatedId}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-2 overflow-y-auto">
        {UNIT_NAV_ITEMS.map((item) => {
          const isActive = activePage === item.page;
          const href = `/units/${unitId}/${item.page}`;
          return (
            <a
              key={item.page}
              href={href}
              className={`px-6 py-3 font-thin text-lg bg-slate-300/60 dark:bg-slate-800/60 hover:bg-slate-200/60
                dark:hover:bg-slate-700/60 rounded-lg block flex items-center gap-2 text-slate-800 dark:text-slate-200
                ${isActive && "bg-slate-200/60 dark:bg-slate-600/60"} transition-all duration-150 ease-in-out`}
            >
              <Icon name={item.icon} className="flex-shrink-0 mr-2" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          klay+ v0.1
        </span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg"
          style={{
            color: "var(--text-tertiary)",
            transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.backgroundColor = "var(--surface-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
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
