"use client";

import type { FC } from "react";
import { motion } from "framer-motion";
import { ThreadPrimitive } from "@assistant-ui/react";
import { Button } from "../ui/button";

export interface SuggestionItem {
  /** The text to display on the suggestion button */
  text: string;
  /** The prompt to send when clicked (defaults to text if not provided) */
  prompt?: string;
}

export interface ThreadWelcomeSuggestionsProps {
  /** Array of suggestions to display */
  suggestions?: SuggestionItem[];
}

// Default suggestions if none provided
const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  {
    text: "What are the advantages of using Assistant Cloud?",
  },
  {
    text: "Write code to demonstrate topological sorting",
  },
  {
    text: "Help me write an essay about AI chat applications",
  },
  {
    text: "What is the weather in San Francisco?",
  },
];

/**
 * Thread welcome suggestions component.
 * Displays a grid of suggestion buttons that auto-send when clicked.
 */
export const ThreadWelcomeSuggestions: FC<ThreadWelcomeSuggestionsProps> = ({
  suggestions = DEFAULT_SUGGESTIONS,
}) => {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={`suggested-action-${suggestion.text}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block"
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestion.prompt || suggestion.text}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="ghost"
              className="bg-white flex h-full whitespace-break-spaces cursor-pointer hover:bg-blue-50 transition-all duration-200 ease-in-out transform w-full flex-1 flex-wrap items-start justify-center gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
              aria-label={suggestion.prompt || suggestion.text}
            >
              <span className="font-medium">
                {suggestion.text}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Export default suggestions for reference
 */
export { DEFAULT_SUGGESTIONS };
