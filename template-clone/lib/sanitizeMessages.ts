/**
 * Sanitize LangChain messages to convert unsupported content part types
 * (like "reasoning") into text parts so the UI converter doesn't crash.
 *
 * This runs BEFORE messages are passed to @assistant-ui/react-langgraph's
 * convertLangChainMessages, which throws on unknown part types.
 */

// Known part types that the converter supports
const SUPPORTED_PART_TYPES = new Set([
  "text",
  "text_delta",
  "image_url",
]);

// Part types we intentionally drop (non-renderable / internal / noisy)
const DROP_PART_TYPES = new Set([
  "reasoning",
  "tool_use",
  "input_json_delta",
  "tool_call",
  "function_call",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;

/**
 * Convert an unsupported content part into a text part.
 * For "reasoning" parts, we extract the text content.
 * For other unknown parts, we stringify them.
 */
function convertUnsupportedPart(part: AnyPart): AnyPart {
  const type = part?.type;

  // Handle reasoning parts specifically
  if (!type) return null;
  if (DROP_PART_TYPES.has(type)) return null;

  // Default behavior: drop unknown parts to avoid crashes.
  return null;
}

/**
 * Sanitize a single message's content array.
 */
function sanitizeContent(content: AnyPart): AnyPart {
  // If content is a string, it's already safe
  if (typeof content === "string") {
    return content;
  }

  // If it's an array, check each part
  if (!Array.isArray(content)) {
    return content;
  }

  return content.map((part: AnyPart) => {
    if (typeof part === "string") {
      return part;
    }

    if (part && typeof part === "object") {
      if (SUPPORTED_PART_TYPES.has(part.type)) {
        return part;
      }
      if (DROP_PART_TYPES.has(part.type)) {
        return null;
      }
    }

    // Drop unsupported/unknown parts to avoid UI converter crashes.
    return convertUnsupportedPart(part);
  }).filter((p: AnyPart) => p !== null);
}

/**
 * Sanitize an array of LangChain messages to ensure all content parts
 * are supported by the UI converter.
 */
export function sanitizeMessages(messages: AnyMessage[]): AnyMessage[] {
  return messages.map((message: AnyMessage) => {
    // Only human and ai messages have complex content arrays
    if (message.type === "human" || message.type === "ai") {
      return {
        ...message,
        content: sanitizeContent(message.content),
      };
    }
    return message;
  });
}

/**
 * Sanitize a single message (useful for streaming scenarios).
 */
export function sanitizeMessage(message: AnyMessage): AnyMessage {
  if (message.type === "human" || message.type === "ai") {
    return {
      ...message,
      content: sanitizeContent(message.content),
    };
  }
  return message;
}
