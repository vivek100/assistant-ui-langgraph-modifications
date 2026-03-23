"use client";

import { useEffect, useState, useCallback } from "react";
import { listThreads, listThreadsByUser, deleteThread } from "@/lib/chatApi";

export type ThreadSummary = {
  thread_id: string;
  created_at: string;
  metadata?: { 
    title?: string;
    user_id?: string;
    [key: string]: string | undefined;
  };
};

export interface UseLangGraphThreadListOptions {
  /** If provided, only fetch threads for this user */
  userId?: string | null;
  /** Additional metadata to filter by */
  additionalMetadata?: Record<string, string>;
  /** Max threads to fetch (default 50) */
  limit?: number;
}

/**
 * Hook to manage the thread list with optional user filtering.
 * 
 * @example
 * // Fetch all threads (no filtering)
 * const { threads } = useLangGraphThreadList();
 * 
 * @example
 * // Fetch only threads for a specific user
 * const { threads } = useLangGraphThreadList({ userId: "user123" });
 */
export function useLangGraphThreadList(options?: UseLangGraphThreadListOptions) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const userId = options?.userId;
  const additionalMetadata = options?.additionalMetadata;
  const limit = options?.limit ?? 50;

  const refreshThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let result;
      if (userId) {
        // Filter by user_id
        result = await listThreadsByUser({ 
          userId, 
          limit,
          additionalMetadata 
        });
      } else {
        // Fetch all threads (no user filter)
        result = await listThreads({ limit });
      }
      
      if (Array.isArray(result)) {
        setThreads(result as ThreadSummary[]);
      } else {
        setThreads([]);
      }
    } catch (error) {
      console.error("Failed to load threads:", error);
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, additionalMetadata, limit]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  const deleteThreadById = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      setThreads(prev => prev.filter(thread => thread.thread_id !== threadId));
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  return {
    threads,
    isLoading,
    refreshThreads,
    deleteThreadById,
  };
}
