import { createPortal } from "react-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

// ─── Overlay Stack (module-level, replaces nanostores) ────────────────────────

const BASE_Z_INDEX = 1000;
let overlayStack: number[] = [];

function acquireOverlay(): number {
  const nextZ = BASE_Z_INDEX + overlayStack.length + 1;
  overlayStack = [...overlayStack, nextZ];
  return nextZ;
}

function releaseOverlay(zIndex: number) {
  overlayStack = overlayStack.filter((z) => z !== zIndex);
}

function isTopOverlay(zIndex: number): boolean {
  return overlayStack[overlayStack.length - 1] === zIndex;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const ANIMATION_MS = 300;

function useOverlay(open: boolean, setOpen: (open: boolean) => void) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const zIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), ANIMATION_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (mounted) {
      setVisible(false);
      requestAnimationFrame(() => {
        setVisible(true);
      });
    }
  }, [mounted]);

  if (open && zIndexRef.current === null) {
    zIndexRef.current = acquireOverlay();
  }

  useEffect(() => {
    if (!mounted && zIndexRef.current !== null) {
      releaseOverlay(zIndexRef.current);
      zIndexRef.current = null;
    }
  }, [mounted]);

  useEffect(() => {
    if (!visible || zIndexRef.current === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTopOverlay(zIndexRef.current!)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, setOpen]);

  return { mounted, visible, zIndexRef };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OverlayProps {
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Overlay({ children, open, setOpen }: OverlayProps) {
  const { mounted, visible, zIndexRef } = useOverlay(open, setOpen);

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div
      style={{
        zIndex: zIndexRef.current!,
        backgroundColor: visible ? "rgba(0, 0, 0, 0.3)" : "transparent",
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        setOpen(false);
      }}
      className={`fixed inset-0 flex justify-end backdrop-blur-sm transition-all duration-300 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`h-full w-fit transition-transform duration-300 ease-out-expo ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
