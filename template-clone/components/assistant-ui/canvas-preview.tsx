"use client";
import { useCanvas } from "./canvas-context";
import { CanvasPreviewBody } from "./canvas-renderer";
import { Button } from "../ui/button";
import { ChevronRightIcon, FileTextIcon, CheckIcon, Loader2 } from "lucide-react";
import { getPreviewRendererForPayload } from "./canvas/registry";
import "./canvas/registerRenderers"; // ensure built-in renderers are registered
import { getRendererTypeForTool } from "./canvas/toolRendererMap";
import { snakeCaseToTitleCase } from "./assistant-state-context";

export type CanvasPreviewProps = {
  toolName: string;
  argsText: string;
  result?: unknown;
  rendererType?: string;
};

export function CanvasPreview({ toolName, argsText, result, rendererType }: CanvasPreviewProps) {
  const { openCanvas } = useCanvas();
  const effectiveRendererType = rendererType ?? getRendererTypeForTool(toolName);

  const payload = { 
    title: toolName, 
    toolName, 
    argsText, 
    result, 
    rendererType: effectiveRendererType 
  } as const;

  return (
    <div className="w-full rounded-lg border text-gray-600">
      <div className="flex items-center gap-2 px-4 py-1">
        <FileTextIcon className="size-3" />
        <p className="flex-grow text-xs truncate">
          {snakeCaseToTitleCase(toolName)}
        </p>
        {/* Status indicator: Running vs Completed */}
        {result === undefined ? (
          <span className="text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Running…
          </span>
        ) : (
          <span className="text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="size-3" />
            Completed
          </span>
        )}
        {result !== undefined && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCanvas(payload)}
            aria-label="Open"
          >
            Open <ChevronRightIcon className="ml-1 size-3" />
          </Button>
        )}
      </div>

      {result !== undefined && (
        <div className="border-t px-4 py-3">
          {/* Use preview renderer if available */}
          {(() => {
            const Preview = getPreviewRendererForPayload(payload);
            if (Preview) return <Preview payload={payload} />;
            return <CanvasPreviewBody result={result} />;
          })()}
        </div>
      )}
    </div>
  );
}

