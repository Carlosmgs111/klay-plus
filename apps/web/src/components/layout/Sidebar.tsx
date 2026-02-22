const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Documents", href: "/documents", icon: "file-text" },
  { label: "Knowledge", href: "/knowledge", icon: "brain" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Profiles", href: "/profiles", icon: "settings-2" },
  { label: "Settings", href: "/settings", icon: "cog" },
] as const;

const ICONS: Record<string, string> = {
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  "file-text":
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8m-8 4h5",
  brain:
    "M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z",
  search:
    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  "settings-2":
    "M12 8a4 4 0 100 8 4 4 0 000-8zm-9 4a9 9 0 1118 0 9 9 0 01-18 0z",
  cog: "M12 8a4 4 0 100 8 4 4 0 000-8zm0-6l1.5 3h3l-2.5 2 1 3L12 8l-3 2 1-3-2.5-2h3L12 2z",
};

interface SidebarProps {
  activePage: string;
}

export function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-sidebar bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Logo */}
      <div className="h-header flex items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold text-gray-900">
          klay<span className="text-primary-600">+</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.label.toLowerCase();
          return (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={ICONS[item.icon] ?? ""}
                />
              </svg>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
        Semantic Knowledge Platform
      </div>
    </aside>
  );
}
