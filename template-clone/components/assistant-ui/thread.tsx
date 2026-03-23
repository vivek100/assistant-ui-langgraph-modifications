"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square,
} from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StreamdownText } from "./streamdown-text";
import { ToolFallback } from "./tool-fallback";
import { CanvasProvider } from "./canvas-context";
import { CanvasPanel } from "./canvas-panel";
import { CanvasPreview } from "./canvas-preview";
import { useCanvas } from "./canvas-context";
import { useThreadAutoScrollFix } from "./hooks/use-thread-auto-scroll";
import { ErrorDisplay } from "./error-display";
import { 
  ThreadWelcomeSuggestions as WelcomeSuggestions, 
  type SuggestionItem 
} from "./thread-welcome-suggestions";

export interface ThreadProps {
  /** If true, uses external CanvasProvider (must be wrapped by parent) */
  useExternalCanvas?: boolean;
  /** Custom suggestions to show in the welcome screen */
  suggestions?: SuggestionItem[];
}

export const Thread: FC<ThreadProps> = ({ useExternalCanvas = false, suggestions }) => {
  // If using external canvas, just render the layout directly
  if (useExternalCanvas) {
    return <CanvasLayout suggestions={suggestions} />;
  }
  
  // Otherwise, wrap with its own CanvasProvider
  return (
    <CanvasProvider>
      <CanvasLayout suggestions={suggestions} />
    </CanvasProvider>
  );
};

interface CanvasLayoutProps {
  suggestions?: SuggestionItem[];
}

const CanvasLayout: FC<CanvasLayoutProps> = ({ suggestions }) => {
  const { open } = useCanvas();
  return (
    <div
      className={cn(
        "h-full grid",
        open ? "grid-cols-[30%_70%]" : "grid-cols-[1fr_0]"
      )}
      style={{ transition: "grid-template-columns 200ms ease" }}
    >
      <div className="min-h-0 h-full min-w-0 flex flex-col overflow-hidden">
        <ThreadInner suggestions={suggestions} />
      </div>
      <div className="min-h-0 h-full min-w-0 flex flex-col overflow-hidden">
        {open ? <CanvasPanel /> : null}
      </div>
    </div>
  );
};

const ThreadInner: FC<ThreadProps> = ({ suggestions }) => {
  const { autoScroll, handleClickAutoScroll, handleScroll } = useThreadAutoScrollFix();

  return (
    <ThreadPrimitive.Root
      className="bg-gray-50 flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
      }}
    >
      <ThreadPrimitive.Viewport
        autoScroll={autoScroll}
        onScroll={handleScroll}
        className="relative pb-8 pt-16 lg:pt-8 flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto py-4"
      >
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        {/* Thinking indicator */}
        <ThreadPrimitive.If running>
          <div className="mx-auto w-full max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)]">
            <div className="text-muted-foreground/80 mt-1 flex items-center gap-2 text-sm">
              <div className="relative flex items-center gap-1">
                <motion.span
                  className="block h-1.5 w-1.5 rounded-full bg-current"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.span
                  className="block h-1.5 w-1.5 rounded-full bg-current"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="block h-1.5 w-1.5 rounded-full bg-current"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span>Agent is thinking…</span>
            </div>
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ErrorDisplay />
      <Composer suggestions={suggestions} handleClickAutoScroll={handleClickAutoScroll} />
    </ThreadPrimitive.Root>
  );
};

interface ThreadScrollToBottomProps {
  handleClickAutoScroll?: () => void;
}

const ThreadScrollToBottom: FC<ThreadScrollToBottomProps> = ({ handleClickAutoScroll }) => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild onClick={handleClickAutoScroll}>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="dark:bg-background dark:hover:bg-accent absolute -top-12 right-4 z-20 self-end rounded-full p-4 disabled:invisible bg-white/90"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      {/* aui-thread-welcome-root */}
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
        {/* aui-thread-welcome-center */}
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          {/* aui-thread-welcome-message */}
          <div className="flex size-full flex-col justify-center px-8 md:mt-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.5 }}
              // aui-thread-welcome-message-motion-1
              className="text-2xl font-semibold"
            >
              Hello there!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
              // aui-thread-welcome-message-motion-2
              className="text-muted-foreground/65 text-2xl"
            >
              How can I help you today?
            </motion.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

// ThreadWelcomeSuggestions is now imported from ./thread-welcome-suggestions

interface ComposerProps {
  suggestions?: SuggestionItem[];
  handleClickAutoScroll?: () => void;
}

const Composer: FC<ComposerProps> = ({ suggestions, handleClickAutoScroll }) => {
  return (
    <div className="relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-1 pt-0 md:pb-2 sticky bottom-0 z-10">
      <ThreadScrollToBottom handleClickAutoScroll={handleClickAutoScroll} />
      <ThreadPrimitive.Empty>
        <WelcomeSuggestions suggestions={suggestions} />
      </ThreadPrimitive.Empty>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Root className="bg-white relative flex w-full flex-col rounded-2xl">
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="bg-white border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] w-full resize-none rounded-t-2xl border-x border-t px-4 pt-2 pb-3 text-base outline-none"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          <ComposerAction />
        </ComposerPrimitive.Root>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Root className="bg-white relative flex w-full flex-col rounded-2xl">
          <ComposerPrimitive.Input
            placeholder="Agent is thinking..."
            className="bg-white border-border dark:border-muted-foreground/15 placeholder:text-muted-foreground max-h-[calc(50dvh)] w-full resize-none rounded-t-2xl border-x border-t px-4 pt-2 pb-3 text-base outline-none"
            rows={1}
            disabled
            aria-label="Message input disabled while agent is responding"
          />
          <ComposerAction />
        </ComposerPrimitive.Root>
      </ThreadPrimitive.If>
    </div>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="bg-white border-border dark:border-muted-foreground/15 relative flex items-center justify-end rounded-b-2xl border-x border-b p-2">
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <Button
            type="submit"
            variant="default"
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            className="bg-gray-900 hover:bg-gray-900/60 text-white size-8 rounded-full border"
            aria-label="Stop generating"
          >
            <Square className="size-3.5 fill-white" />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        // aui-assistant-message-root
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        {/* aui-assistant-message-avatar */}
        <div className="ring-border bg-background col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
          <ThreadPrimitive.If running>
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              aria-label="Assistant is responding"
            >
              <StarIcon size={14} />
            </motion.div>
          </ThreadPrimitive.If>
          <ThreadPrimitive.If running={false}>
            <StarIcon size={14} />
          </ThreadPrimitive.If>
        </div>

        {/* aui-assistant-message-content */}
        <div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 leading-7 break-words">
          <MessagePrimitive.Content
            components={{
              Text: StreamdownText,
              tools: {
                by_name: {
                  render_markdown: CanvasPreview,
                },
                Fallback: ToolFallback,
              },
            }}
          />
        </div>

        <AssistantActionBar />

        {/* aui-assistant-branch-picker */}
        <BranchPicker className="col-start-2 row-start-2 mr-2 -ml-2" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      // aui-assistant-action-bar-root
      className="text-muted-foreground data-floating:bg-background col-start-3 row-start-2 mt-3 ml-3 flex gap-1 data-floating:absolute data-floating:mt-2 data-floating:rounded-md data-floating:border data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        // aui-user-message-root
        className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-1 px-[var(--thread-padding-x)] py-4 [&:where(>*)]:col-start-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <UserActionBar />

        {/* aui-user-message-content */}
        <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words">
          <MessagePrimitive.Content components={{ Text: StreamdownText }} />
        </div>

        {/* aui-user-branch-picker */}
        <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      // aui-user-action-bar-root
      className="col-start-1 mt-2.5 mr-3 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    // aui-edit-composer-wrapper
    <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)]">
      {/* aui-edit-composer-root */}
      <ComposerPrimitive.Root className="bg-muted ml-auto flex w-full max-w-7/8 flex-col rounded-xl">
        {/* aui-edit-composer-input */}
        <ComposerPrimitive.Input
          className="text-foreground flex min-h-[60px] w-full resize-none bg-transparent p-4 outline-none"
          autoFocus
        />

        {/* aui-edit-composer-footer */}
        <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      // aui-branch-picker-root
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      {/* aui-branch-picker-state */}
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
      fill="currentColor"
    />
  </svg>
);
