"use client";
import { useMemo } from "react";

function tryParseJson(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

export function pretty(value: unknown): string {
  try {
    if (value === undefined) return "";
    if (value === null) return "null";
    if (typeof value === "string") {
      const parsed = tryParseJson(value);
      return typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
    }
    const json = JSON.stringify(value, null, 2);
    return json ?? "";
  } catch {
    return String(value);
  }
}

export function useCanvasPreviewText(result: unknown, maxChars = 400) {
  return useMemo(() => {
    let text = typeof result === "string" ? result : pretty(result);
    if (!text) text = "";
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + "\n…";
  }, [result, maxChars]);
}

export function CanvasPreviewBody({ result }: { result: unknown }) {
  const text = useCanvasPreviewText(result);
  if (!text || text.trim().length === 0) {
    return (
      <p className="text-xs leading-relaxed text-muted-foreground">Awaiting tool result…</p>
    );
  }
  return <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{text}</pre>;
}

export function CanvasFullBody({ result }: { result: unknown }) {
  const text = pretty(result);
  return <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text || "<no content>"}</pre>;
}
