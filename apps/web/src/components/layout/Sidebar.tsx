import { Icon } from "../shared/Icon.js";
import { useTheme } from "../../contexts/ThemeContext.js";
import type { IconName } from "../shared/Icon.js";

const NAV_ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Documents", href: "/documents", icon: "file-text" },
  { label: "Knowledge", href: "/knowledge", icon: "brain" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Profiles", href: "/profiles", icon: "sliders" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

interface SidebarProps {
  activePage: string;
}

export function Sidebar({ activePage }: SidebarProps) {
  const { resolved, toggleTheme } = useTheme();

  return (
    <aside className="sticky left-0 top-0 bottom-0 flex flex-col z-10 bg-slate-200/40 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="h-header flex items-center px-3 py-4 border-b border-slate-200 dark:border-slate-800">
        <i className="bx bxs-layers-plus-alt text-2xl mr-2 bg-slate-200/60 dark:bg-slate-800/60 rounded-md p-2 aspect-square w-12 h-12 flex items-center justify-center"></i>
        <span
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          klay+
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.label.toLowerCase();
          return (
            <a
              key={item.href}
              href={item.href}
              className={`px-6 py-3 font-thin text-lg bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-200/60 
                dark:hover:bg-slate-700/60 rounded-lg block flex items-center gap-2 text-slate-800 dark:text-slate-200 ${isActive && "bg-slate-200/60 dark:bg-slate-600/60"}`}
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
