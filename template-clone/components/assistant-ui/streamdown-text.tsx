"use client";

import { Streamdown } from "streamdown";
import React, { memo, type FC, type ReactElement } from "react";
import type { TextContentPartComponent } from "@assistant-ui/react";

// ============================================================================
// Code Block Handler Registry
// ============================================================================

export type CodeBlockHandler = FC<CodeBlockProps>;

export interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

// Registry for custom code block handlers
const codeBlockHandlers = new Map<string, CodeBlockHandler>();

/**
 * Register a custom code block handler for a specific language prefix.
 * 
 * @example
 * // Register handler for ```mywidget blocks
 * registerCodeBlockHandler('language-mywidget', MyWidgetCodeBlock);
 * 
 * // Register handler for ```chart:* blocks (prefix match)
 * registerCodeBlockHandler('language-chart:', ChartCodeBlock);
 */
export function registerCodeBlockHandler(
  languagePrefix: string,
  handler: CodeBlockHandler
): void {
  codeBlockHandlers.set(languagePrefix, handler);
}

/**
 * Unregister a code block handler.
 */
export function unregisterCodeBlockHandler(languagePrefix: string): void {
  codeBlockHandlers.delete(languagePrefix);
}

/**
 * Get all registered code block handlers.
 */
export function getCodeBlockHandlers(): Map<string, CodeBlockHandler> {
  return new Map(codeBlockHandlers);
}

/**
 * Clear all registered code block handlers.
 */
export function clearCodeBlockHandlers(): void {
  codeBlockHandlers.clear();
}

// ============================================================================
// Custom Code Component
// ============================================================================

/**
 * Custom code component that routes to registered handlers based on language.
 * Falls back to Streamdown's built-in handlers for unregistered languages.
 */
const CustomCodeComponent: FC<CodeBlockProps> = (props): ReactElement | null => {
  const className = props.className || "";
  
  // Check for exact match first
  if (codeBlockHandlers.has(className)) {
    const Handler = codeBlockHandlers.get(className)!;
    return <Handler {...props} />;
  }
  
  // Check for prefix match (e.g., "language-chart:" matches "language-chart:bar")
  for (const [prefix, Handler] of codeBlockHandlers) {
    if (prefix.endsWith(':') && className.startsWith(prefix)) {
      return <Handler {...props} />;
    }
  }
  
  // Extract code content
  const codeContent = typeof props.children === 'string' 
    ? props.children 
    : Array.isArray(props.children) 
      ? props.children.join('') 
      : String(props.children || '');

  // If there is NO className, this is inline code. Render as native inline <code>
  if (!className) {
    return <code className={props.className}>{codeContent}</code>;
  }

  // Otherwise, this is a fenced code block; wrap via Streamdown for built-in handlers
  const language = className.replace('language-', '');
  const markdown = `\`\`\`${language}\n${codeContent}\n\`\`\``;
  return <Streamdown>{markdown}</Streamdown>;
};

// ============================================================================
// Streamdown Text Component
// ============================================================================

interface TextContentPartProps {
  text?: string | unknown;
}

const StreamdownTextImpl: TextContentPartComponent = (props: TextContentPartProps) => {
  const raw = props?.text;

  let safeText: string;
  if (typeof raw === "string") {
    safeText = raw;
  } else {
    try {
      safeText = String(raw);
    } catch {
      try {
        safeText = JSON.stringify(raw);
      } catch {
        safeText = "";
      }
    }
  }

  return (
    <Streamdown
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: CustomCodeComponent as any
      }}
    >
      {safeText}
    </Streamdown>
  );
};

export const StreamdownText = memo(StreamdownTextImpl);
