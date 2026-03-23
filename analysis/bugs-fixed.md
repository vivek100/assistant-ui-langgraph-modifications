# Bug Fixes

This document details the bugs we identified and fixed in the assistant-ui LangGraph template.

---

## 1. Auto-Scroll Not Working During Streaming

**Problem**: When the agent is streaming a response, the viewport doesn't auto-scroll to show new content. Users have to manually scroll down.

**Root Cause**: The default `autoScroll` behavior in `ThreadPrimitive.Viewport` doesn't properly handle the case when a user scrolls up during streaming, then expects auto-scroll to resume.

**Solution**: Created a custom hook `useThreadAutoScrollFix` that:
- Tracks scroll position with a ref
- Detects manual scroll-up to disable auto-scroll
- Re-enables auto-scroll when user clicks "scroll to bottom" or reaches bottom
- Re-enables auto-scroll when a new run starts

**File**: `components/assistant-ui/hooks/use-thread-auto-scroll.ts`

```typescript
// Key implementation
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

  // Handler for scroll events - detects manual scroll up
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    if (isRunning && lastScrollTop.current > target.scrollTop) {
      setAutoScroll(false);
    }
    lastScrollTop.current = target.scrollTop;
  }, [isRunning]);

  return { autoScroll, handleClickAutoScroll, handleScroll };
}
```

**Usage in thread.tsx**:
```typescript
const { autoScroll, handleClickAutoScroll, handleScroll } = useThreadAutoScrollFix();

<ThreadPrimitive.Viewport
  autoScroll={autoScroll}
  onScroll={handleScroll}
  // ...
>
```

**Status**: ✅ Fixed  
**Upstream Potential**: High - this is a common issue

---

## 2. UI Crash on Unsupported Content Types

**Problem**: The UI crashes when LangChain messages contain content parts with unsupported types like `reasoning`, `tool_use`, `input_json_delta`, etc.

**Root Cause**: `@assistant-ui/react-langgraph`'s `convertLangChainMessages` throws on unknown part types.

**Solution**: Created `sanitizeMessages.ts` that filters/converts unsupported content parts before they reach the converter.

**File**: `lib/sanitizeMessages.ts`

```typescript
// Known part types that the converter supports
const SUPPORTED_PART_TYPES = new Set(["text", "text_delta", "image_url"]);

// Part types we intentionally drop
const DROP_PART_TYPES = new Set([
  "reasoning",
  "tool_use", 
  "input_json_delta",
  "tool_call",
  "function_call",
]);

export function sanitizeMessages(messages: AnyMessage[]): AnyMessage[] {
  return messages.map((message) => {
    if (message.type === "human" || message.type === "ai") {
      return {
        ...message,
        content: sanitizeContent(message.content),
      };
    }
    return message;
  });
}
```

**Usage in MyAssistant.tsx**:
```typescript
onSwitchToThread: async (threadId) => {
  const state = await getThreadState(threadId);
  return {
    messages: sanitizeMessages(state.values.messages || []),
    interrupts: state.tasks?.[0]?.interrupts,
  };
}
```

**Status**: ✅ Fixed  
**Upstream Potential**: Medium - depends on how official API handles this

---

## 3. Thread State Loading Errors Not Handled

**Problem**: When `getThreadState` fails (network error, invalid thread, etc.), the entire app crashes or shows a blank screen.

**Root Cause**: No try-catch around async operations in `onSwitchToThread`.

**Solution**: Added comprehensive error handling with user-friendly error display.

**File**: `components/MyAssistant.tsx`

```typescript
onSwitchToThread: async (threadId) => {
  try {
    const state = await getThreadState(threadId);
    // ... success path
  } catch (error) {
    const msg = (error as Error)?.message || "Unable to load the selected thread.";
    setErrorState({
      title: "Load Thread Failed",
      message: msg,
      showRefresh: false,
      showNewChat: true,
    });
    return { messages: [], interrupts: undefined };
  }
}
```

**Status**: ✅ Fixed  
**Upstream Potential**: High - error handling is essential

---

## 4. Stream Connection Errors Silent

**Problem**: When the LangGraph stream fails to connect, users see nothing - no error message, no way to retry.

**Solution**: Added error handling in the `stream` function with error state propagation.

**File**: `components/MyAssistant.tsx`

```typescript
stream: async (messages, { command }) => {
  try {
    // ... stream logic
  } catch (err: unknown) {
    console.error("LangGraph stream error:", err);
    setErrorState({
      title: "Connection Error",
      message: (err as Error)?.message || "Failed to contact assistant service.",
      showRefresh: true,
      showNewChat: true,
    });
    throw err;
  }
}
```

**Status**: ✅ Fixed  
**Upstream Potential**: High

---

## Summary Table

| Bug | Severity | File(s) | Upstream Potential |
|-----|----------|---------|-------------------|
| Auto-scroll during streaming | Medium | `use-thread-auto-scroll.ts` | High |
| Unsupported content types crash | High | `sanitizeMessages.ts` | Medium |
| Thread loading errors | High | `MyAssistant.tsx` | High |
| Stream connection errors | High | `MyAssistant.tsx` | High |
