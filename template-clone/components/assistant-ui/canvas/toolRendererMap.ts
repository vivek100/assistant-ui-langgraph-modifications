export const TOOL_RENDERER_MAP: Record<string, string> = {
  // Example mapping: toolName -> rendererType
  // "generate_report": "streamdown",
  // Add your tool-specific mappings here
  event_relevance_agent_tool: "streamdown",
  render_markdown: "markdown-report",
};

export function getRendererTypeForTool(toolName?: string): string | undefined {
  if (!toolName) return undefined;
  return TOOL_RENDERER_MAP[toolName];
}
