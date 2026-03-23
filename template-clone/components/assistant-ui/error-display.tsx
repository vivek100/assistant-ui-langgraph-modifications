"use client";

import { useState, type FC } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, ChevronDown, PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useAssistantState } from "./assistant-state-context";
import { cn } from "@/lib/utils";

/**
 * Error display component that shows errors from the assistant state.
 * Displays an animated banner with configurable actions (refresh, new chat).
 */
export const ErrorDisplay: FC = () => {
  const assistantState = useAssistantState<{ 
    errorState: import("./assistant-state-context").ErrorState;
    setErrorState: (error: import("./assistant-state-context").ErrorState) => void;
  }>();
  
  const { openNewChat } = assistantState;
  const errorState = assistantState.errorState;
  const setErrorState = assistantState.setErrorState;
  const [showMore, setShowMore] = useState<boolean>(false);

  if (!errorState) return null;

  return (
    <div className="mx-auto w-full max-w-[var(--thread-max-width)] px-4 py-2">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-destructive/10 border-destructive/20 text-destructive flex flex-col rounded-lg border"
      >
        <div className="flex w-full items-center gap-3 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
          
          <div className="flex-1">
            <p className="text-sm font-medium text-red-600">
              {errorState.title}
            </p>
          </div>

          {/* Refresh button */}
          {errorState.showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="hover:bg-destructive/20 shrink-0 cursor-pointer"
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          )}

          {/* New Chat button */}
          {errorState.showNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorState(null);
                openNewChat();
              }}
              className="hover:bg-destructive/20 shrink-0 cursor-pointer"
            >
              <PlusIcon className="mr-2 size-4" />
              New Chat
            </Button>
          )}

          {/* Expand/collapse button for details */}
          {errorState.message && (
            <Button
              title="Show more"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowMore((value) => !value)}
              aria-label="Expand error details"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-all",
                  showMore ? "rotate-180" : ""
                )}
              />
            </Button>
          )}

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setErrorState(null)}
            className="shrink-0 text-xs"
            aria-label="Dismiss error"
          >
            Dismiss
          </Button>
        </div>

        {/* Expandable details section */}
        {errorState.message && showMore && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-500 italic">
              {errorState.message}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
