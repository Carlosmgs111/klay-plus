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
  "arrow-up": "bx bxs-up-arrow-alt",
  "arrow-down": "bx bxs-down-arrow-alt",
  check: "bx bxs-check-circle",
  x: "bx bxs-x-circle",
  "alert-circle": "bx bxs-error-circle",
  info: "bx bxs-info-circle",
  "chevron-right": "bx bxs-chevron-right",
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
