/**
 * Reference Selection State Management
 * 
 * Manages the state for "Select Mode" - allows users to select items 
 * from canvas/documents and reference them in chat messages.
 * 
 * This is a generalized version of the BPM selection state that can be
 * adapted for any document type.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Represents a reference to a document item
 */
export interface ItemReference {
  /** Unique reference ID */
  id: string;
  /** Category/type key (e.g., 'modules', 'sections', 'pages') */
  categoryKey: string;
  /** The actual item ID */
  itemId: string;
  /** Human-readable name */
  displayName: string;
  /** Path to item in document (e.g., "/sections/0/pages/1") */
  path: string;
  /** Badge label (e.g., "M1", "S2", "P1") */
  categoryLabel: string;
  /** Document ID this item belongs to */
  documentId?: string;
  /** Document name */
  documentName?: string;
  /** Additional metadata about the item */
  metadata?: Record<string, unknown>;
}

interface SelectionState {
  // Mode state
  isSelectMode: boolean;
  
  // Selected items
  selectedItems: ItemReference[];
  
  // Hover state (for highlighting)
  hoveredItem: ItemReference | null;
  
  // Scroll target (item to scroll to)
  scrollTargetId: string | null;
  
  // Actions
  toggleSelectMode: () => void;
  setSelectMode: (enabled: boolean) => void;
  addSelection: (ref: ItemReference) => void;
  removeSelection: (refId: string) => void;
  clearSelections: () => void;
  setHoveredItem: (ref: ItemReference | null) => void;
  scrollToItem: (refId: string) => void;
  clearScrollTarget: () => void;
  
  // Utility
  isItemSelected: (refId: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()(
  devtools(
    (set, get) => ({
      isSelectMode: false,
      selectedItems: [],
      hoveredItem: null,
      scrollTargetId: null,
      
      toggleSelectMode: () => set(
        (state) => ({ isSelectMode: !state.isSelectMode }),
        undefined,
        'toggleSelectMode'
      ),
      
      setSelectMode: (enabled) => set(
        { isSelectMode: enabled },
        undefined,
        'setSelectMode'
      ),
      
      addSelection: (ref) => set(
        (state) => {
          // Prevent duplicates
          if (state.selectedItems.some(r => r.id === ref.id)) {
            return state;
          }
          return { selectedItems: [...state.selectedItems, ref] };
        },
        undefined,
        'addSelection'
      ),
      
      removeSelection: (refId) => set(
        (state) => ({
          selectedItems: state.selectedItems.filter(r => r.id !== refId)
        }),
        undefined,
        'removeSelection'
      ),
      
      clearSelections: () => set(
        { selectedItems: [] },
        undefined,
        'clearSelections'
      ),
      
      setHoveredItem: (ref) => set(
        { hoveredItem: ref },
        undefined,
        'setHoveredItem'
      ),
      
      scrollToItem: (refId) => set(
        { scrollTargetId: refId },
        undefined,
        'scrollToItem'
      ),
      
      clearScrollTarget: () => set(
        { scrollTargetId: null },
        undefined,
        'clearScrollTarget'
      ),
      
      isItemSelected: (refId) => {
        return get().selectedItems.some(r => r.id === refId);
      },
    }),
    { name: 'SelectionStore' }
  )
);

// Convenience hooks
export const useIsSelectMode = () => useSelectionStore((state) => state.isSelectMode);
export const useSelectedItems = () => useSelectionStore((state) => state.selectedItems);
export const useHoveredItem = () => useSelectionStore((state) => state.hoveredItem);
export const useScrollTargetId = () => useSelectionStore((state) => state.scrollTargetId);
