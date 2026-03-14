import { useEffect, type RefObject } from "react";

/**
 * Calls `onClickOutside` when a mousedown occurs outside the given ref element.
 * Only active when `enabled` is true (defaults to true).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClickOutside, enabled]);
}
