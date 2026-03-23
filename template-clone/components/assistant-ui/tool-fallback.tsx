"use client";

import type { FC } from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { JsonViewer } from "./json-viewer";
import { snakeCaseToTitleCase } from "./assistant-state-context";
import { cn } from "@/lib/utils";

interface ToolFallbackProps {
  toolName: string;
  argsText: string;
  result?: unknown;
}

export const ToolFallback: FC<ToolFallbackProps> = ({
  toolName,
  argsText,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Parse JSON data
  let parsedArgs;
  let parsedResult;
  try {
    parsedArgs = JSON.parse(argsText);
  } catch {
    parsedArgs = { error: "Invalid JSON", raw: argsText };
  }

  if (result !== undefined) {
    try {
      parsedResult = typeof result === "string" ? JSON.parse(result) : result;
    } catch {
      parsedResult = { error: "Invalid JSON", raw: result };
    }
  }

  const isRunning = result === undefined;
  const displayName = snakeCaseToTitleCase(toolName);

  return (
    <div className="mb-2 flex w-full flex-col rounded-lg border text-gray-600">
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 w-full text-left transition-colors",
          !isCollapsed && "border-b"
        )}
      >
        <Zap className="size-3 text-gray-400" />
        <p className="flex-grow text-xs truncate">
          {displayName}
        </p>
        {/* Status indicator */}
        {isRunning ? (
          <span className="text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Running…
          </span>
        ) : (
          <span className="text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="size-3" />
            Completed
          </span>
        )}
        {isCollapsed ? (
          <ChevronDownIcon className="size-4 text-gray-400" />
        ) : (
          <ChevronUpIcon className="size-4 text-gray-400" />
        )}
      </button>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="px-4">
            <p className="font-semibold mb-1 text-xs text-gray-500">Arguments:</p>
            <JsonViewer data={parsedArgs} />
          </div>
          {result !== undefined && (
            <div className="border-t border-dashed px-4 pt-2 pb-2">
              <p className="font-semibold mb-2 text-xs text-gray-500">Result:</p>
              <JsonViewer data={parsedResult} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

