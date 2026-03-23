"use client";
import { useEffect, useRef } from "react";
import { useCanvas } from "./canvas-context";
import { Button } from "../ui/button";
import { CanvasFullBody } from "./canvas-renderer";
import { getRendererForPayload } from "./canvas/registry";
import "./canvas/registerRenderers"; // side-effect: register built-in renderers
import { X, Download } from "lucide-react";
import { snakeCaseToTitleCase } from "./assistant-state-context";

export function CanvasPanel() {
  const { open, closeCanvas, payload } = useCanvas();
  const contentRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCanvas();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeCanvas]);

  // Add print styles when component mounts
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "canvas-print-styles";
    style.textContent = `
      @media print {
        /* Hide everything on the page */
        body * {
          visibility: hidden !important;
        }
        
        /* Show only the canvas panel and its children */
        aside[role="dialog"],
        aside[role="dialog"] * {
          visibility: visible !important;
        }
        
        /* Hide the header */
        aside[role="dialog"] header,
        aside[role="dialog"] header * {
          visibility: hidden !important;
          display: none !important;
        }
        
        /* Position canvas panel for print */
        aside[role="dialog"] {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
        }
        
        /* Ensure content is visible and properly styled */
        aside[role="dialog"] > div:last-child {
          overflow: visible !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById("canvas-print-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  const title = payload?.title || payload?.toolName || "Canvas";

  return (
    <aside
      role="dialog"
      aria-labelledby="canvas-title"
      className="h-full w-full bg-background border-l shadow-xl flex flex-col overflow-hidden print:fixed print:inset-0 print:border-0"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b print:hidden">
        <h3 id="canvas-title" className="text-sm font-semibold truncate flex-1">
          {snakeCaseToTitleCase(title)}
        </h3>
        <div className="flex items-center gap-2">
          {/* Print/Download button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            aria-label="Print or save as PDF"
            className="flex items-center gap-1.5"
          >
            <Download className="size-4" />
            Download
          </Button>
          {/* Close button */}
          <Button variant="ghost" size="sm" onClick={closeCanvas} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
      </header>
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto p-4 print:overflow-visible print:h-auto"
      >
        <CanvasPanel.Content />
      </div>
    </aside>
  );
}

// Simple slot pattern so consumers can define how to render payload
CanvasPanel.Content = function Content() {
  const { payload } = useCanvas();
  if (!payload) return null;
  const entry = getRendererForPayload(payload);
  if (entry) {
    const Component = entry.render;
    return <Component payload={payload} />;
  }
  // Fallback: show full body text if no renderer found
  return <CanvasFullBody result={payload.result ?? payload.argsText ?? payload} />;
};
