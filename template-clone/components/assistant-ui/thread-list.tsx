"use client";

import type { FC } from "react";
import { ThreadListItemPrimitive, ThreadListPrimitive, useAssistantRuntime } from "@assistant-ui/react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, PlusIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useLangGraphThreadList, type ThreadSummary } from "@/lib/thread-list-runtime";

export interface ThreadListProps {
  onClose?: () => void;
  /** If provided, only show threads for this user */
  userId?: string | null;
}

export const ThreadList: FC<ThreadListProps> = ({ onClose, userId }) => {
  const { threads, isLoading, deleteThreadById } = useLangGraphThreadList({ userId });

  return (
    <ThreadListPrimitive.Root 
      className="text-foreground flex h-full w-full min-h-0 flex-col items-stretch gap-3 bg-white p-3 overflow-hidden"
    >
      <div className="flex items-center justify-between px-1 border-b pb-2">
        <div className="text-sm font-semibold px-1 py-1">Chat History</div>
        {onClose && (
          <TooltipIconButton
            className="hover:text-foreground/60 text-foreground ml-auto mr-1 size-4 p-4"
            variant="ghost"
            tooltip="Close"
            onClick={onClose}
          >
            <X />
          </TooltipIconButton>
        )}
      </div>
      <ThreadListNew />
      <ThreadListItems threads={threads} deleteThreadById={deleteThreadById} />
      {isLoading && <div className="text-sm text-muted-foreground px-2">Loading threads...</div>}
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        className="data-active:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start"
        variant="ghost"
      >
        <PlusIcon />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC<{
  threads: ThreadSummary[];
  deleteThreadById: (threadId: string) => Promise<void>;
}> = ({ threads, deleteThreadById }) => {
  return (
    <ScrollArea className="flex-1 h-full">
      <div className="flex flex-col gap-2 pr-2 pb-4">
        {threads.map((thread) => (
          <ThreadListItem
            key={thread.thread_id}
            thread={thread}
            deleteThreadById={deleteThreadById}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

const ThreadListItem: FC<{
  thread: ThreadSummary;
  deleteThreadById: (threadId: string) => Promise<void>;
}> = ({ thread, deleteThreadById }) => {
  const runtime = useAssistantRuntime();
  const router = useRouter();
  const currentThreadId = getRuntimeThreadId(runtime);

  const handleThreadClick = async () => {
    console.log("Thread clicked:", thread.thread_id);
    try {
      console.log("Calling runtime.switchToThread with:", thread.thread_id);
      await runtime.switchToThread(thread.thread_id);
      router.replace(`/?threadId=${encodeURIComponent(thread.thread_id)}`);
      console.log("Thread switch completed successfully");
    } catch (error) {
      console.error("Error switching to thread:", error);
    }
  };

  const isSelected = currentThreadId === thread.thread_id;

  return (
    <ThreadListItemPrimitive.Root className={`data-active:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 ${
      isSelected ? 'bg-primary/10 border border-primary/20' : ''
    }`}>
      <ThreadListItemPrimitive.Trigger
        className="flex-grow px-3 py-2 text-start cursor-pointer"
        onClick={handleThreadClick}
      >
        <ThreadListItemTitle thread={thread} />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive
        threadId={thread.thread_id}
        deleteThreadById={deleteThreadById}
      />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC<{ thread: ThreadSummary }> = ({ thread }) => {
  const title = thread.metadata?.title || `Thread ${thread.thread_id.slice(-8)}`;
  const createdAt = new Date(thread.created_at).toLocaleDateString();

  return (
    <div className="text-sm">
      <p className="font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground">{createdAt}</p>
    </div>
  );
};

const ThreadListItemArchive: FC<{
  threadId: string;
  deleteThreadById: (threadId: string) => Promise<void>;
}> = ({ threadId, deleteThreadById }) => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="hover:text-foreground/60 text-foreground ml-auto mr-1 size-4 p-4"
        variant="ghost"
        tooltip="Archive thread"
        onClick={() => deleteThreadById(threadId)}
      >
        <ArchiveIcon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};

function getRuntimeThreadId(runtime: unknown): string | undefined {
  if (runtime && typeof runtime === 'object') {
    const r = runtime as { thread?: { id?: string } | null; currentThreadId?: string };
    return r.thread?.id ?? r.currentThreadId;
  }
  return undefined;
}

