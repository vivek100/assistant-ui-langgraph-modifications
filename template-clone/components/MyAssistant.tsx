"use client";

import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { useRouter, useSearchParams } from "next/navigation";

import { 
  createThread, 
  getThreadState, 
  sendMessage, 
  updateThreadMetadata,
  generateThreadTitle 
} from "@/lib/chatApi";
import { sanitizeMessages } from "@/lib/sanitizeMessages";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Menu } from "lucide-react";
import { 
  AssistantStateProvider, 
  AssistantErrorBoundary,
  type ErrorState 
} from "@/components/assistant-ui/assistant-state-context";
import { CanvasProvider } from "@/components/assistant-ui/canvas-context";
import type { SuggestionItem } from "@/components/assistant-ui/thread-welcome-suggestions";

export interface MyAssistantProps {
  /** Custom suggestions to show in the welcome screen */
  suggestions?: SuggestionItem[];
  /** Custom context to pass to the assistant state */
  customContext?: Record<string, unknown>;
  /** User ID for thread filtering and metadata */
  userId?: string | null;
  /** Additional metadata to store with threads */
  threadMetadata?: Record<string, string>;
}

/**
 * MyAssistant component wrapped in Suspense for useSearchParams compatibility.
 */
export function MyAssistant(props: MyAssistantProps = {}) {
  return (
    <Suspense fallback={<AssistantLoadingFallback />}>
      <MyAssistantWithSearchParams {...props} />
    </Suspense>
  );
}

function AssistantLoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-muted-foreground">Loading assistant...</div>
    </div>
  );
}

function MyAssistantWithSearchParams({ 
  suggestions, 
  customContext,
  userId,
  threadMetadata 
}: MyAssistantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("threadId") ?? undefined;

  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(initialThreadId);
  const threadIdRef = useRef<string | undefined>(initialThreadId);
  const isFirstMessageRef = useRef<boolean>(true);
  const didSwitchFromUrlRef = useRef<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use assistant state context for error handling
  const [errorState, setErrorState] = useState<ErrorState>(null);

  // Sync URL -> state/ref so runtime sees it (ref-only won't re-render).
  useEffect(() => {
    if (initialThreadId) {
      threadIdRef.current = initialThreadId;
      setActiveThreadId(initialThreadId);
      isFirstMessageRef.current = false; // Existing thread, not first message
      didSwitchFromUrlRef.current = false;
    } else {
      threadIdRef.current = undefined;
      setActiveThreadId(undefined);
      isFirstMessageRef.current = true;
      didSwitchFromUrlRef.current = false;
    }
  }, [initialThreadId]);

  const handleNewChat = useCallback(() => {
    // Clear the current thread and show a blank UI.
    // A real backend thread will only be created on the next send.
    threadIdRef.current = undefined;
    setActiveThreadId(undefined);
    isFirstMessageRef.current = true;
    setIsSidebarOpen(false);
    router.replace("/");
  }, [router]);

  const runtime = useLangGraphRuntime({
    threadId: activeThreadId,
    stream: async (messages, { command }) => {
      try {
        let createdNew = false;
        if (!threadIdRef.current) {
          // Create thread with user_id and custom metadata
          const { thread_id } = await createThread(userId, threadMetadata);
          threadIdRef.current = thread_id;
          setActiveThreadId(thread_id);
          createdNew = true;
          isFirstMessageRef.current = true;
        }
        const threadId = threadIdRef.current;
        
        if (createdNew && threadId) {
          // Update URL so reloads and navigation keep the same thread.
          router.replace(`/?threadId=${encodeURIComponent(threadId)}`);
        }
        
        // Generate thread title from first user message
        if (isFirstMessageRef.current && threadId && messages?.length) {
          const firstUserMessage = messages.find(
            (msg) => msg.type === "human" || (msg as { role?: string }).role === "user"
          );
          if (firstUserMessage) {
            const content = typeof firstUserMessage.content === "string" 
              ? firstUserMessage.content 
              : JSON.stringify(firstUserMessage.content);
            const title = generateThreadTitle(content);
            // Update thread metadata with title (fire and forget)
            updateThreadMetadata(threadId, { title }).catch(console.error);
            isFirstMessageRef.current = false;
          }
        }
        
        return await sendMessage({
          threadId,
          messages,
          command,
          userId,
          customConfig: threadMetadata,
        });
      } catch (err: unknown) {
        console.error("LangGraph stream error:", err);
        const msg = (err as Error)?.message || "Failed to contact assistant service.";
        setErrorState({
          title: "Connection Error",
          message: msg,
          showRefresh: true,
          showNewChat: true,
        });
        throw err;
      }
    },
    onSwitchToNewThread: async () => {
      // Do NOT create a backend thread here.
      // Just clear the current thread so the UI shows a blank conversation.
      threadIdRef.current = undefined;
      setActiveThreadId(undefined);
      isFirstMessageRef.current = true;
      setErrorState(null);
      router.replace("/");
    },
    onSwitchToThread: async (threadId) => {
      console.log("onSwitchToThread called with threadId:", threadId);
      try {
        const state = await getThreadState(threadId);
        console.log("Thread state received:", state);
        threadIdRef.current = threadId;
        setActiveThreadId(threadId);
        isFirstMessageRef.current = false; // Existing thread
        setErrorState(null);
        router.replace(`/?threadId=${encodeURIComponent(threadId)}`);
        return {
          messages: sanitizeMessages(state.values.messages || []),
          interrupts: state.tasks?.[0]?.interrupts,
        };
      } catch (error) {
        console.error("Error in onSwitchToThread:", error);
        const msg = (error as Error)?.message || "Unable to load the selected thread.";
        setErrorState({
          title: "Load Thread Failed",
          message: msg,
          showRefresh: false,
          showNewChat: true,
        });
        return {
          messages: [],
          interrupts: undefined,
        };
      }
    },
  });

  // On reload/direct navigation, actually load the thread via runtime switching
  // (this is the same path as clicking a thread in the sidebar).
  useEffect(() => {
    if (!initialThreadId) return;
    if (didSwitchFromUrlRef.current) return;
    didSwitchFromUrlRef.current = true;

    try {
      const maybePromise = runtime.switchToThread(initialThreadId) as unknown;
      if (
        typeof maybePromise === "object" &&
        maybePromise !== null &&
        "then" in (maybePromise as Record<string, unknown>)
      ) {
        (maybePromise as Promise<unknown>).catch((e: unknown) =>
          console.error("Failed to switch to URL thread:", e)
        );
      }
    } catch (e: unknown) {
      console.error("Failed to switch to URL thread:", e);
    }
  }, [initialThreadId, runtime]);

  return (
    <AssistantErrorBoundary>
      <AssistantRuntimeProvider runtime={runtime}>
        <AssistantStateProvider
          threadIdRef={threadIdRef}
          customState={{ errorState, setErrorState, userId, ...customContext }}
          onNewChat={handleNewChat}
        >
          <CanvasProvider>
            <MyAssistantInner
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              suggestions={suggestions}
              userId={userId}
            />
          </CanvasProvider>
        </AssistantStateProvider>
      </AssistantRuntimeProvider>
    </AssistantErrorBoundary>
  );
}

interface MyAssistantInnerProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  suggestions?: SuggestionItem[];
  userId?: string | null;
}

function MyAssistantInner({ 
  isSidebarOpen, 
  setIsSidebarOpen,
  suggestions,
  userId
}: MyAssistantInnerProps) {
  return (
    <div className="grid h-full grid-cols-[1fr] relative bg-gray-50">
      {/* Overlay Sidebar: threads list */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white border-r shadow-lg z-40 min-h-0 flex flex-col overflow-hidden">
            <ThreadList onClose={() => setIsSidebarOpen(false)} userId={userId} />
          </div>
        </>
      )}
      {/* Main: active thread */}
      <div className="min-h-0 flex flex-col overflow-hidden relative">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-3 left-3 z-10 inline-flex items-center justify-center rounded-md border bg-white/80 backdrop-blur px-2 py-2 text-sm shadow hover:bg-gray-100"
          aria-label="Open thread list"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Thread />
      </div>
    </div>
  );
}

