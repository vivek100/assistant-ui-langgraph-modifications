/**
 * Reference Parser
 * 
 * Utilities for parsing and formatting item references in messages.
 * References use a markdown-like syntax: @[Label: Name](ref:/path)
 * 
 * This is a generalized version that can be adapted for any document type.
 */

import type { ItemReference } from './selectionState';

/**
 * Parsed reference from message text
 */
export interface ParsedReference {
  /** Category label (M1, S2, etc.) */
  label: string;
  /** Item display name */
  name: string;
  /** Path in document */
  path: string;
  /** Document ID */
  documentId?: string;
  /** Item ID */
  itemId?: string;
  /** Category key */
  categoryKey?: string;
  /** Raw matched string */
  raw: string;
}

// Pattern: @[M1: Item Name](ref:/path|doc:doc123|id:item123)
// Extended pattern to support metadata
const REF_PATTERN = /@\[([^\]:]+):\s*([^\]]+)\]\(ref:([^|)]+)(?:\|([^)]+))?\)/g;

/**
 * Parse references from message text
 * @param text - The message text to parse
 * @returns Object with clean text and extracted references
 */
export function parseReferences(text: string): {
  cleanText: string;
  references: ParsedReference[];
} {
  const references: ParsedReference[] = [];
  
  // Reset regex state
  REF_PATTERN.lastIndex = 0;
  
  let match;
  while ((match = REF_PATTERN.exec(text)) !== null) {
    const [raw, label, name, path, metadataStr] = match;
    const ref: ParsedReference = {
      label: label.trim(),
      name: name.trim(),
      path,
      raw,
    };
    
    // Parse metadata if present (format: doc:doc123|id:item123|cat:modules)
    if (metadataStr) {
      const metadataPairs = metadataStr.split('|');
      for (const pair of metadataPairs) {
        const [key, value] = pair.split(':');
        if (key === 'doc') ref.documentId = value;
        if (key === 'id') ref.itemId = value;
        if (key === 'cat') ref.categoryKey = value;
      }
    }
    
    references.push(ref);
  }
  
  // Remove reference syntax from clean text
  // Keep the reference as a simpler inline mention
  const cleanText = text
    .replace(REF_PATTERN, (_, label, name) => `[${label}: ${name}]`)
    .trim();
  
  return { cleanText, references };
}

/**
 * Format references into message text (for backend parsing)
 * @param references - Array of item references
 * @param userText - The user's message text
 * @returns Formatted message with reference syntax including metadata
 */
export function formatReferencesForMessage(
  references: ItemReference[],
  userText: string
): string {
  if (references.length === 0) {
    return userText;
  }
  
  // Format each reference with metadata
  const refStrings = references.map(ref => {
    const parts = [`ref:${ref.path}`];
    if (ref.documentId) parts.push(`doc:${ref.documentId}`);
    if (ref.itemId) parts.push(`id:${ref.itemId}`);
    if (ref.categoryKey) parts.push(`cat:${ref.categoryKey}`);
    const metadata = parts.slice(1).join('|');
    const fullPath = metadata ? `${ref.path}|${metadata}` : ref.path;
    return `@[${ref.categoryLabel}: ${ref.displayName}](ref:${fullPath})`;
  });
  
  // Store references separately - user text stays clean
  // Backend will parse the reference syntax
  return `${refStrings.join(' ')}\n\n${userText}`;
}

/**
 * Extract user text only (removes all reference syntax)
 * @param text - Full message text
 * @returns Just the user's text without references
 */
export function extractUserText(text: string): string {
  return text.replace(REF_PATTERN, '').trim();
}

/**
 * Check if text contains references
 * @param text - Text to check
 * @returns True if text contains references
 */
export function hasReferences(text: string): boolean {
  REF_PATTERN.lastIndex = 0;
  return REF_PATTERN.test(text);
}

/**
 * Extract just the reference paths from text
 * @param text - Text to extract from
 * @returns Array of paths
 */
export function extractReferencePaths(text: string): string[] {
  const { references } = parseReferences(text);
  return references.map(r => r.path);
}

/**
 * Build a path for an item
 * @param categoryKey - The category key (modules, sections, etc.)
 * @param index - The index of the item in its array
 * @param parentPath - Optional parent path
 * @returns Path string
 */
export function buildPath(
  categoryKey: string,
  index: number,
  parentPath?: string
): string {
  const segment = `/${categoryKey}/${index}`;
  return parentPath ? `${parentPath}${segment}` : segment;
}
