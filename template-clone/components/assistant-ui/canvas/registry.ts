import { CanvasPayloadBase, CanvasRendererEntry } from "./types";

const registry = new Map<string, CanvasRendererEntry>();

export function registerRenderer(key: string, entry: CanvasRendererEntry) {
  registry.set(key, entry);
}

export function getRendererByKey(key: string): CanvasRendererEntry | undefined {
  return registry.get(key);
}

export function getRendererForPayload(payload: CanvasPayloadBase): CanvasRendererEntry | undefined {
  // 1) Prefer explicit rendererType
  if (payload.rendererType) {
    const byType = registry.get(payload.rendererType);
    if (byType) return byType;
  }
  // 2) Check by toolName mapping
  if (payload.toolName) {
    for (const entry of registry.values()) {
      if (entry.toolNames?.includes(payload.toolName)) return entry;
    }
  }
  // 3) Heuristic: if result/argsText is a string that looks like markdown, pick streamdown when available
  const text = typeof payload.result === "string" ? payload.result : (typeof payload.argsText === "string" ? payload.argsText : "");
  if (text && /[#*_`\-]|```|\n/.test(text)) {
    const sd = registry.get("streamdown");
    if (sd) return sd;
  }
  // 4) Fallback to default renderer
  return registry.get("default");
}

export function getPreviewRendererForPayload(payload: CanvasPayloadBase) {
  const entry = getRendererForPayload(payload);
  return entry?.preview ? entry.preview : undefined;
}

export function ensureDefaultRenderer(key = "default") {
  if (!registry.has(key)) {
    console.warn(`[canvas.registry] default renderer '${key}' is not registered.`);
  }
}
