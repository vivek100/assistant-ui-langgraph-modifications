import type { ReactElement } from "react";

export type CanvasRendererType = string;

export type CanvasPayloadBase = {
  title?: string;
  toolName?: string;
  argsText?: string;
  result?: unknown;
  // New optional fields to guide rendering
  rendererType?: CanvasRendererType; // e.g., "streamdown", "json", "table", etc.
  content?: unknown; // canonical content to render
  meta?: Record<string, unknown>; // arbitrary extra info
};

export type CanvasRendererProps = {
  payload: CanvasPayloadBase;
};

export type CanvasPreviewRendererProps = {
  payload: CanvasPayloadBase;
};

export type CanvasRenderer = (props: CanvasRendererProps) => ReactElement | null;
export type CanvasPreviewRenderer = (props: CanvasPreviewRendererProps) => ReactElement | null;

export type CanvasRendererEntry = {
  render: CanvasRenderer;
  preview?: CanvasPreviewRenderer;
  // optional list of tool names this renderer supports
  toolNames?: string[];
};
