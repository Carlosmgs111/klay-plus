import type { SVGProps } from "react";

const ICON_PATHS: Record<string, string> = {
  grid: "bx bxs-dashboard-alt",
  "file-text": "bx bxs-file",
  brain: "bx bxs-brain",
  search: "bx bxs-search",
  sliders: "bx bxs-slider",
  settings: "bx bxs-cog",
  sun: "bx bxs-sun",
  moon: "bx bxs-moon",
  plus: "bx bxs-plus-circle",
  upload: "bx bxs-archive-arrow-up",
  "cloud": "bx bx-cloud",
  "cloud-fill": "bx bxs-cloud",
  "archive-down": "bx bxs-archive-arrow-down",
  "arrow-up": "bx bx-arrow-up",
  "arrow-down": "bx bxs-arrow-down",
  check: "bx bxs-check-circle",
  x: "bx bxs-x-circle",
  "alert-circle": "bx bxs-error-circle",
  info: "bx bxs-info-circle",
  "chevron-right": "bx bxs-chevron-right",
  "chevron-down": "bx bxs-chevron-down",
  "chevron-up": "bx bxs-chevron-up",
  "external-link": "bx bxs-link-external",
  refresh: "bx bxs-refresh",
  trash: "bx bxs-trash",
  eye: "bx bxs-show",
  filter: "bx bxs-filter-alt",
  layers: "bx bxs-layers-down-right",
  "check-circle": "bx bxs-check-circle",
  "x-circle": "bx bxs-x-circle",
  zap: "bx bxs-bolt",
  server: "bx bxs-server",
  globe: "bx bxs-globe",
  edit: "bx bxs-edit",
  link: "bx bxs-link",
  unlink: "bx bx-unlink",
  "chevron-left": "bx bxs-chevron-left",
  history: "bx bxs-history",
  undo: "bx bx-undo",
  "folder-plus": "bx bxs-folder-plus",
  "arrow-left": "bx bxs-left-arrow-alt",
  database: "bx bxs-data",
  clock: "bx bxs-time",
  "layout-dashboard": "bx bxs-layout",
  archive: "bx bxs-archive",
  "alert-triangle": "bx bxs-error",
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  name: keyof typeof ICON_PATHS | string;
}

export function Icon({ name, className = "" }: IconProps) {
  const icon = ICON_PATHS[name];
  if (!icon) return null;

  const twClassName = [icon, className].join(" ");

  return <i className={twClassName} />;
}

export type IconName = keyof typeof ICON_PATHS;
