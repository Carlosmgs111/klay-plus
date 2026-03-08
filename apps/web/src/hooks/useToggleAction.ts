import { useState } from "react";

/**
 * Manages open/close state for action overlays with optional controlled mode.
 *
 * Standalone: component owns its own state.
 * Controlled: parent passes open/setOpen (e.g., from a dropdown menu).
 */
export function useToggleAction(
  externalOpen?: boolean,
  externalSetOpen?: (v: boolean) => void,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;
  return { open, setOpen };
}
