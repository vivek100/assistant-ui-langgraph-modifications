"use client";
import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import type { CanvasPayloadBase } from "./canvas/types";

export const CANVAS_WIDTH = "min(500px,60vw)";

export type CanvasPayload = CanvasPayloadBase;

type CanvasContextValue = {
  open: boolean;
  payload: CanvasPayload | null;
  openCanvas: (payload: CanvasPayload) => void;
  closeCanvas: () => void;
};

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<CanvasPayload | null>(null);

  const openCanvas = useCallback((p: CanvasPayload) => {
    setPayload(p);
    setOpen(true);
  }, []);

  const closeCanvas = useCallback(() => {
    setOpen(false);
  }, []);

  // Auto-close when the tab becomes hidden (user switches tabs)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setOpen(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const value = useMemo(() => ({ open, payload, openCanvas, closeCanvas }), [open, payload, openCanvas, closeCanvas]);

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used within CanvasProvider");
  return ctx;
}
