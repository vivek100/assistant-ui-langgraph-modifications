"use client";
import type { CanvasRendererProps, CanvasPreviewRendererProps } from "../types";
import { pretty } from "../../canvas-renderer";

export function DefaultRenderer({ payload }: CanvasRendererProps) {
  const text = pretty(payload.result ?? payload.content ?? payload.argsText ?? "");
  return <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text || "<no content>"}</pre>;
}

export function DefaultPreview({ payload }: CanvasPreviewRendererProps) {
  const text = pretty(payload.result ?? payload.content ?? payload.argsText ?? "");
  return <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{text || "<no content>"}</pre>;
}

const defaultCanvasRendererExport = {
  render: DefaultRenderer,
  preview: DefaultPreview,
};

export default defaultCanvasRendererExport;
