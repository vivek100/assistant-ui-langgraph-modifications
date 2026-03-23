"use client";
import { Streamdown } from "streamdown";
import type { CanvasRendererProps, CanvasPreviewRendererProps } from "../types";

export function StreamdownRenderer({ payload }: CanvasRendererProps) {
  const text =
    (typeof payload.content === "string" && payload.content)
    || (typeof payload.result === "string" && payload.result)
    || (typeof payload.argsText === "string" && payload.argsText)
    || "";
  return <Streamdown>{text}</Streamdown>;
}

export function StreamdownPreview({ payload }: CanvasPreviewRendererProps) {
  const text =
    (typeof payload.content === "string" && payload.content)
    || (typeof payload.result === "string" && payload.result)
    || (typeof payload.argsText === "string" && payload.argsText)
    || "";
  // Truncate for preview and render smaller text
  const maxChars = 400;
  const previewText = text.length > maxChars ? text.slice(0, maxChars) + "\n…" : text;
  return (
    <div className="text-xs leading-relaxed text-muted-foreground">
      <Streamdown>{previewText}</Streamdown>
    </div>
  );
}

const streamdownRendererExport = {
  render: StreamdownRenderer,
  preview: StreamdownPreview,
};

export default streamdownRendererExport;

