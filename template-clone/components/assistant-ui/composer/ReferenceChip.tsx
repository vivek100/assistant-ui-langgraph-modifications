/**
 * ReferenceChip - Displays a selected item as a chip in the composer
 * 
 * Shows the category badge (M1, S2, etc.), truncated name, and remove button.
 * Can be color-coded based on the category type.
 */

"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemReference } from '@/lib/references';

export interface ReferenceChipProps {
  /** The item reference to display */
  reference: ItemReference;
  /** Called when the remove button is clicked */
  onRemove: () => void;
  /** Called when the chip is clicked (e.g., to scroll to item) */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Get styling for a category (customize based on your document types)
 */
function getCategoryStyle(categoryKey: string): string {
  const styles: Record<string, string> = {
    modules: "bg-blue-100 text-blue-700 border-blue-200",
    sections: "bg-green-100 text-green-700 border-green-200",
    pages: "bg-purple-100 text-purple-700 border-purple-200",
    items: "bg-orange-100 text-orange-700 border-orange-200",
    default: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return styles[categoryKey] || styles.default;
}

export function ReferenceChip({ 
  reference, 
  onRemove, 
  onClick,
  className 
}: ReferenceChipProps) {
  const categoryStyle = getCategoryStyle(reference.categoryKey);
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
        "border cursor-pointer hover:opacity-80 transition-opacity",
        "select-none",
        categoryStyle,
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Click to scroll to item in canvas"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <span className="font-medium">{reference.categoryLabel}</span>
      <span className="max-w-[120px] truncate text-[11px] opacity-80">
        {reference.displayName}
      </span>
      <button
        type="button"
        onClick={(e) => { 
          e.stopPropagation(); 
          onRemove(); 
        }}
        className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${reference.displayName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/**
 * Enhanced chip for displaying in sent messages with metadata
 */
export function ReferenceChipSent({ 
  reference,
  onClick,
  className 
}: {
  reference: ItemReference;
  onClick?: () => void;
  className?: string;
}) {
  const categoryStyle = getCategoryStyle(reference.categoryKey);
  const [showDetails, setShowDetails] = React.useState(false);
  
  const tooltipText = React.useMemo(() => {
    const parts: string[] = [];
    if (reference.documentId) parts.push(`Doc: ${reference.documentId}`);
    if (reference.documentName) parts.push(`"${reference.documentName}"`);
    parts.push(`Path: ${reference.path}`);
    if (reference.itemId) parts.push(`ID: ${reference.itemId}`);
    return parts.join('\n');
  }, [reference]);
  
  return (
    <span 
      className={cn(
        "relative inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs",
        "border shadow-sm",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        categoryStyle,
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={tooltipText}
    >
      <span className="font-semibold">{reference.categoryLabel}</span>
      <span className="max-w-[150px] truncate font-medium">
        {reference.displayName}
      </span>
      {reference.documentId && (
        <span className="text-[10px] opacity-60 font-mono ml-1">
          {reference.documentId.slice(0, 8)}...
        </span>
      )}
      {/* Tooltip with full details */}
      {showDetails && tooltipText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-pre-line pointer-events-none z-50 max-w-xs">
          {tooltipText}
        </div>
      )}
    </span>
  );
}

export default ReferenceChip;
