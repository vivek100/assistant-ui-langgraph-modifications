"use client";
import { Streamdown } from "streamdown";
import type { CanvasRendererProps, CanvasPreviewRendererProps } from "../types";

function extractMarkdownContent(result: unknown): string {
  // Handle JSON string that needs parsing
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed.content === "string") {
        return parsed.content;
      }
    } catch {
      // If parsing fails, treat as raw markdown
      return result;
    }
  }
  
  // Handle already parsed JSON object
  if (result && typeof result === "object" && "content" in result) {
    type ContentCarrier = { content: unknown };
    const content = (result as ContentCarrier).content;
    if (typeof content === "string") {
      return content;
    }
  }
  
  // Fallback to string representation
  return typeof result === "string" ? result : "";
}

export function MarkdownReportRenderer({ payload }: CanvasRendererProps) {
  const markdownContent = extractMarkdownContent(payload.result);
  
  if (!markdownContent) {
    return (
      <div className="text-muted-foreground p-4">
        No markdown content available
      </div>
    );
  }
  
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Streamdown>{markdownContent}</Streamdown>
    </div>
  );
}

export function MarkdownReportPreview({ payload }: CanvasPreviewRendererProps) {
  const markdownContent = extractMarkdownContent(payload.result);
  
  if (!markdownContent) {
    return (
      <div className="text-xs text-muted-foreground">
        No markdown content available
      </div>
    );
  }
  
  // Truncate for preview
  const maxChars = 200;
  const previewText = markdownContent.length > maxChars 
    ? markdownContent.slice(0, maxChars) + "\n…" 
    : markdownContent;
  
  return (
    <div className="text-xs leading-relaxed text-muted-foreground prose prose-xs max-w-none dark:prose-invert">
      <Streamdown>{previewText}</Streamdown>
    </div>
  );
}

const markdownReportRendererExport = {
  render: MarkdownReportRenderer,
  preview: MarkdownReportPreview,
};

export default markdownReportRendererExport;

