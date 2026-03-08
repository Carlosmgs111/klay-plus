import { Icon } from "../shared/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import type { IconName } from "../shared/Icon";

const NAV_ITEMS: {
  label: string;
  page: string;
  href: string;
  icon: IconName;
}[] = [
  { label: "Contexts", page: "contexts", href: "/contexts", icon: "brain" },
  { label: "Profiles", page: "profiles", href: "/profiles", icon: "sliders" },
  { label: "Settings", page: "settings", href: "/settings", icon: "settings" },
];

interface SidebarProps {
  activePage: string;
}

export function Sidebar({ activePage }: SidebarProps) {
  const { resolved, toggleTheme } = useTheme();

  return (
    <aside className="sticky left-0 top-0 bottom-0 flex flex-col z-10 bg-surface-1/70 backdrop-blur-xl border-r border-subtle">
      {/* Logo */}
      <div className="h-header flex items-center px-3 py-4 border-b border-subtle">
        <i className="bx bxs-layers-plus-alt text-2xl mr-2 bg-accent text-white rounded-lg p-2 aspect-square w-10 h-10 flex items-center justify-center shadow-md"></i>
        <span className="text-xl font-bold text-primary tracking-heading">
          klay+
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.page;
          return (
            <a
              key={item.href}
              href={item.href}
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
        <span className="text-xs text-tertiary">klay+ v0.1</span>
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
