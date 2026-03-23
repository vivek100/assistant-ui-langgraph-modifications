/**
 * Application Constants
 * 
 * Centralized configuration values to avoid magic strings throughout the codebase.
 */

// Thread UI Configuration
export const THREAD_CONFIG = {
  maxWidth: "48rem",
  paddingX: "1rem",
} as const;

// Canvas Configuration
export const CANVAS_CONFIG = {
  width: "min(500px,60vw)",
  openGridCols: "grid-cols-[30%_70%]",
  closedGridCols: "grid-cols-[1fr_0]",
  transitionDuration: "200ms",
} as const;

// Default Welcome Suggestions
export const DEFAULT_SUGGESTIONS = [
  { text: "What can you help me with?" },
  { text: "Write code to demonstrate topological sorting" },
  { text: "Help me write an essay about AI chat applications" },
  { text: "What is the weather in San Francisco?" },
] as const;

// Thread List Configuration
export const THREAD_LIST_CONFIG = {
  defaultLimit: 50,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  connectionError: "Failed to contact assistant service.",
  loadThreadFailed: "Unable to load the selected thread.",
  threadNotFound: "Thread not found",
  unknownError: "An unknown error occurred",
} as const;

// Auto-scroll Configuration
export const AUTO_SCROLL_CONFIG = {
  scrollThreshold: 100, // pixels from bottom to consider "at bottom"
} as const;

// Supported Content Types for Message Sanitization
export const SUPPORTED_CONTENT_TYPES = new Set([
  "text",
  "text_delta",
  "image_url",
]);

// Content Types to Drop (intentionally filtered out)
export const DROP_CONTENT_TYPES = new Set([
  "reasoning",
  "tool_use",
  "input_json_delta",
  "tool_call",
  "function_call",
]);
