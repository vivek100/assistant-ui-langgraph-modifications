/**
 * ComposerWithReferences - Enhanced composer with reference chips
 * 
 * This component extends the standard composer to:
 * - Display selected items as chips above the input
 * - Format references into message text when sending
 * - Support keyboard shortcuts for managing selections
 */

"use client";

import { useCallback, useEffect, useRef } from 'react';
import { 
  ComposerPrimitive,
  useComposerRuntime,
  useThreadRuntime,
} from '@assistant-ui/react';
import { ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  useSelectionStore, 
  formatReferencesForMessage, 
  extractUserText 
} from '@/lib/references';
import { ReferenceChip } from './ReferenceChip';

export interface ComposerWithReferencesProps {
  /** Placeholder text when no references selected */
  placeholder?: string;
  /** Placeholder text when references are selected */
  placeholderWithRefs?: string;
  /** Additional class name for the container */
  className?: string;
  /** Whether the composer is disabled */
  disabled?: boolean;
}

export function ComposerWithReferences({
  placeholder = "Send a message...",
  placeholderWithRefs = "Ask about selected items...",
  className,
  disabled = false,
}: ComposerWithReferencesProps) {
  const selectedItems = useSelectionStore((s) => s.selectedItems);
  const removeSelection = useSelectionStore((s) => s.removeSelection);
  const clearSelections = useSelectionStore((s) => s.clearSelections);
  const setSelectMode = useSelectionStore((s) => s.setSelectMode);
  const scrollToItem = useSelectionStore((s) => s.scrollToItem);
  
  const composerRuntime = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const containerRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  
  const hasSelections = selectedItems.length > 0;
  
  // Handle clicking on a chip to scroll to the item
  const handleChipClick = useCallback((refId: string) => {
    scrollToItem(refId);
  }, [scrollToItem]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit select mode and clear selections
      if (e.key === 'Escape') {
        setSelectMode(false);
        return;
      }
      
      // Ctrl+Shift+S to toggle select mode
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        useSelectionStore.getState().toggleSelectMode();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectMode]);
  
  // Keep user text separate - don't show references in input field
  useEffect(() => {
    if (!composerRuntime || isUpdatingRef.current) return;
    
    const currentText = composerRuntime.getState().text;
    const userText = extractUserText(currentText);
    
    const hasRefs = /@\[[^\]]+\]\(ref:/.test(currentText);
    
    if (hasRefs && userText !== currentText) {
      isUpdatingRef.current = true;
      composerRuntime.setText(userText);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [composerRuntime]);
  
  // Handle send - add references and send message directly
  const handleSendClick = useCallback((e: React.MouseEvent) => {
    if (!composerRuntime || !threadRuntime) return;
    
    const currentText = composerRuntime.getState().text;
    const userText = extractUserText(currentText);
    
    const hasRefsInText = /@\[[^\]]+\]\(ref:/.test(currentText);
    const shouldIntercept = selectedItems.length > 0 || hasRefsInText;
    
    if (shouldIntercept) {
      e.preventDefault();
      e.stopPropagation();
      
      const finalMessage = selectedItems.length > 0
        ? formatReferencesForMessage(selectedItems, userText)
        : currentText;
      
      if (finalMessage.trim()) {
        threadRuntime.append({
          role: "user",
          content: [{ type: "text", text: finalMessage }],
        });
        
        composerRuntime.setText('');
        clearSelections();
      }
    }
  }, [selectedItems, composerRuntime, threadRuntime, clearSelections]);
  
  // Handle Enter key in the input
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && composerRuntime && threadRuntime) {
      const currentText = composerRuntime.getState().text || '';
      const hasRefsInText = /@\[[^\]]+\]\(ref:/.test(currentText);
      const shouldIntercept = selectedItems.length > 0 || hasRefsInText;
      
      if (shouldIntercept) {
        e.preventDefault();
        
        const userText = extractUserText(currentText);
        const finalMessage = selectedItems.length > 0
          ? formatReferencesForMessage(selectedItems, userText)
          : currentText;
        
        if (finalMessage.trim()) {
          threadRuntime.append({
            role: "user",
            content: [{ type: "text", text: finalMessage }],
          });
          composerRuntime.setText('');
          clearSelections();
        }
      }
    }
  }, [selectedItems, composerRuntime, threadRuntime, clearSelections]);
  
  return (
    <div ref={containerRef} className={cn("flex flex-col", className)}>
      {/* Reference chips row */}
      {hasSelections && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-2xl">
          <span className="text-xs text-gray-500 mr-1">Referencing:</span>
          {selectedItems.map(ref => (
            <ReferenceChip
              key={ref.id}
              reference={ref}
              onRemove={() => removeSelection(ref.id)}
              onClick={() => handleChipClick(ref.id)}
            />
          ))}
          {selectedItems.length > 1 && (
            <button
              type="button"
              onClick={clearSelections}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      
      {/* Composer */}
      <ComposerPrimitive.Root 
        className={cn(
          "bg-white relative flex w-full flex-col",
          hasSelections ? "rounded-b-2xl" : "rounded-2xl"
        )}
      >
        <ComposerPrimitive.Input
          placeholder={hasSelections ? placeholderWithRefs : placeholder}
          className={cn(
            "bg-white border-border dark:border-muted-foreground/15",
            "focus:outline-primary placeholder:text-muted-foreground",
            "max-h-[calc(50dvh)] w-full resize-none border-x border-t px-4 pt-2 pb-3 text-base outline-none",
            hasSelections ? "rounded-none" : "rounded-t-2xl"
          )}
          rows={1}
          autoFocus
          disabled={disabled}
          aria-label="Message input"
          onKeyDown={handleInputKeyDown}
        />
        
        {/* Action bar */}
        <div className="bg-white border-border dark:border-muted-foreground/15 relative flex items-center justify-between rounded-b-2xl border-x border-b p-2">
          {/* Left side - selection indicator */}
          <div className="flex items-center gap-2">
            {hasSelections && (
              <span className="text-xs text-gray-500">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          
          {/* Right side - send button */}
          <ComposerPrimitive.Send asChild>
            <Button
              type="submit"
              variant="default"
              className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
              aria-label="Send message"
              disabled={disabled}
              onClick={handleSendClick}
            >
              <ArrowUpIcon className="size-5" />
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
}

/**
 * Disabled version of the composer (shown when agent is running)
 */
export function ComposerWithReferencesDisabled() {
  const selectedItems = useSelectionStore((s) => s.selectedItems);
  const hasSelections = selectedItems.length > 0;
  
  return (
    <div className="flex flex-col">
      {/* Reference chips row (read-only) */}
      {hasSelections && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-2xl opacity-60">
          <span className="text-xs text-gray-500 mr-1">Referencing:</span>
          {selectedItems.map(ref => (
            <ReferenceChip
              key={ref.id}
              reference={ref}
              onRemove={() => {}}
              className="pointer-events-none"
            />
          ))}
        </div>
      )}
      
      <ComposerPrimitive.Root 
        className={cn(
          "bg-white relative flex w-full flex-col",
          hasSelections ? "rounded-b-2xl" : "rounded-2xl"
        )}
      >
        <ComposerPrimitive.Input
          placeholder="Agent is thinking..."
          className={cn(
            "bg-white border-border dark:border-muted-foreground/15",
            "placeholder:text-muted-foreground",
            "max-h-[calc(50dvh)] w-full resize-none border-x border-t px-4 pt-2 pb-3 text-base outline-none",
            hasSelections ? "rounded-none" : "rounded-t-2xl"
          )}
          rows={1}
          disabled
          aria-label="Message input disabled while agent is responding"
        />
        <div className="bg-white border-border dark:border-muted-foreground/15 relative flex items-center justify-end rounded-b-2xl border-x border-b p-2">
          <Button
            type="button"
            variant="default"
            className="bg-gray-400 size-8 rounded-full border cursor-not-allowed"
            disabled
            aria-label="Send disabled"
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
}

export default ComposerWithReferences;
