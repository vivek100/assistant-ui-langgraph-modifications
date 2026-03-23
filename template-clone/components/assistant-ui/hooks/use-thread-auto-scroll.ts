"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useThread, useThreadViewport } from "@assistant-ui/react";

/**
 * Hook to manage auto-scroll behavior in the thread viewport.
 * 
 * Features:
 * - Auto-scrolls when agent is running and user is at bottom
 * - Disables auto-scroll when user manually scrolls up
 * - Re-enables auto-scroll when user clicks "scroll to bottom" or reaches bottom
 * 
 * @returns {Object} Auto-scroll state and handlers
 */
export function useThreadAutoScrollFix() {
  const isRunning = useThread((thread) => thread.isRunning);
  const isAtBottom = useThreadViewport((viewport) => viewport.isAtBottom);
  
  const [autoScroll, setAutoScroll] = useState(true);
  const lastScrollTop = useRef(0);

  // Re-enable auto-scroll when a new run starts
  useEffect(() => {
    if (isRunning) {
      setAutoScroll(true);
    }
  }, [isRunning]);

  // Re-enable auto-scroll when user reaches bottom while running
  useEffect(() => {
    if (isRunning && isAtBottom) {
      setAutoScroll(true);
    }
  }, [isRunning, isAtBottom]);

  // Handler for manual scroll-to-bottom click
  const handleClickAutoScroll = useCallback(() => {
    setAutoScroll(true);
  }, []);

  // Handler for scroll events - detects manual scroll up
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    
    // If running and user scrolled up, disable auto-scroll
    if (isRunning && lastScrollTop.current > target.scrollTop) {
      setAutoScroll(false);
    }
    
    lastScrollTop.current = target.scrollTop;
  }, [isRunning]);

  return {
    autoScroll,
    handleClickAutoScroll,
    handleScroll,
  };
}
