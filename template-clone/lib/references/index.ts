/**
 * Reference System
 * 
 * Exports for the item reference selection and parsing system.
 */

export {
  useSelectionStore,
  useIsSelectMode,
  useSelectedItems,
  useHoveredItem,
  useScrollTargetId,
  type ItemReference,
} from './selectionState';

export {
  parseReferences,
  formatReferencesForMessage,
  extractUserText,
  hasReferences,
  extractReferencePaths,
  buildPath,
  type ParsedReference,
} from './referenceParser';
