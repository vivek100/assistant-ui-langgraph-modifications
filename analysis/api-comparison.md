# API Comparison: Our Template vs Official Assistant-UI

This document compares our implementation with the official assistant-ui APIs to identify alignment opportunities.

---

## Version Comparison

| Package | Our Version | Latest Official |
|---------|-------------|-----------------|
| `@assistant-ui/react` | 0.9.1 | 0.14+ |
| `@assistant-ui/react-langgraph` | 0.5.11 | 0.7+ |
| `@assistant-ui/react-markdown` | 0.9.1 | 0.14+ |

**Key Change**: v0.7 introduced a simplified API for `useLangGraphRuntime`.

---

## 1. Runtime API Comparison

### Our Implementation (Old API Pattern)

**File**: `components/MyAssistant.tsx:101-194`

```typescript
const runtime = useLangGraphRuntime({
  threadId: activeThreadId,
  stream: async (messages, { command }) => {
    // Manual thread creation
    if (!threadIdRef.current) {
      const { thread_id } = await createThread(userId, threadMetadata);
      threadIdRef.current = thread_id;
    }
    return await sendMessage({ threadId, messages, command, userId });
  },
  onSwitchToNewThread: async () => {
    threadIdRef.current = undefined;
    setActiveThreadId(undefined);
    router.replace("/");
  },
  onSwitchToThread: async (threadId) => {
    const state = await getThreadState(threadId);
    threadIdRef.current = threadId;
    return {
      messages: sanitizeMessages(state.values.messages || []),
      interrupts: state.tasks?.[0]?.interrupts,
    };
  },
});
```

### Official API (v0.7+ Pattern)

```typescript
const runtime = useLangGraphRuntime({
  stream: async function* (messages, { initialize, command }) {
    const { externalId } = await initialize();
    if (!externalId) throw new Error("Thread not found");
    yield* await sendMessage({ threadId: externalId, messages, command });
  },
  create: async () => {
    const { thread_id } = await createThread();
    return { externalId: thread_id };
  },
  load: async (externalId) => {
    const state = await getThreadState(externalId);
    return {
      messages: state.values.messages,
      interrupts: state.tasks[0]?.interrupts,
    };
  },
  delete: async (threadId) => {
    await deleteThread(threadId);
  },
});
```

### Key Differences

| Aspect | Our Implementation | Official v0.7+ |
|--------|-------------------|----------------|
| Thread creation | Manual in `stream` | `create` callback |
| Thread loading | `onSwitchToThread` | `load` callback |
| New thread | `onSwitchToNewThread` | Handled by runtime |
| Stream function | Returns Promise | Generator function (`yield*`) |
| Thread ID access | Manual ref tracking | `initialize()` provides IDs |

### Migration Action Required ⚠️

Our implementation needs to be updated to use the new API pattern for:
- Better separation of concerns
- Built-in thread management
- Cleaner async flow with generators

---

## 2. Suggestions API Comparison

### Our Implementation

**File**: `components/assistant-ui/thread-welcome-suggestions.tsx`

```typescript
export interface SuggestionItem {
  text: string;
  prompt?: string;
}

<ThreadPrimitive.Suggestion
  prompt={suggestion.prompt || suggestion.text}
  method="replace"
  autoSend
  asChild
>
  <Button>{suggestion.text}</Button>
</ThreadPrimitive.Suggestion>
```

### Official API

```typescript
import { useAui, Suggestions } from "@assistant-ui/react";

const aui = useAui({
  suggestions: Suggestions([
    "What can you help me with?",
    { title: "Weather", label: "Check the weather", prompt: "What's the weather?" },
  ]),
});

// In component
<ThreadPrimitive.Suggestions>
  {() => (
    <SuggestionPrimitive.Trigger send clearComposer asChild>
      <button><SuggestionPrimitive.Title /></button>
    </SuggestionPrimitive.Trigger>
  )}
</ThreadPrimitive.Suggestions>
```

### Key Differences

| Aspect | Our Implementation | Official |
|--------|-------------------|----------|
| Configuration | Props to component | `Suggestions()` API in `useAui` |
| Rendering | Custom map loop | `ThreadPrimitive.Suggestions` iterator |
| Primitives | Only `ThreadPrimitive.Suggestion` | Full primitive set (Title, Description, Trigger) |

### Migration Action: Medium Priority

Our approach works but doesn't leverage the full primitive system. Consider migrating for consistency.

---

## 3. Tool Fallback Comparison

### Our Implementation

**File**: `components/assistant-ui/tool-fallback.tsx`

```typescript
export const ToolFallback: FC<ToolFallbackProps> = ({ toolName, argsText, result }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Custom collapsible UI with JsonViewer
};
```

### Official API

```typescript
// Via CLI: npx assistant-ui add tool-fallback
// Creates components/assistant-ui/tool-fallback.tsx

// Usage in Thread
<Thread components={{
  ToolFallback: ({ toolName, args, result }) => <CustomToolFallback ... />
}} />
```

### Key Differences

| Aspect | Our Implementation | Official |
|--------|-------------------|----------|
| Props | `argsText` (string) | `args` (object) |
| Installation | Manual | CLI command |
| Customization | Full custom | Scaffolded with customization points |

### Migration Action: Low Priority

Our implementation is more feature-rich. Could propose as enhancement to official.

---

## 4. Thread List Comparison

### Our Implementation

**File**: `lib/thread-list-runtime.tsx`

```typescript
export function useLangGraphThreadList(options?: { userId?: string }) {
  // Custom hook with user filtering
  const refreshThreads = useCallback(async () => {
    if (userId) {
      result = await listThreadsByUser({ userId });
    } else {
      result = await listThreads();
    }
  }, [userId]);
}
```

### Official API

```typescript
// With Assistant Cloud
const runtime = useLangGraphRuntime({
  cloud: new AssistantCloud({
    baseUrl: process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL,
  }),
  // ... other options
});

// ThreadList component handles persistence automatically
```

### Key Differences

| Aspect | Our Implementation | Official |
|--------|-------------------|----------|
| Persistence | Custom LangGraph SDK calls | Assistant Cloud |
| User filtering | Manual metadata filtering | Cloud handles auth |
| Thread list | Custom hook | Built into runtime |

### Migration Action: Depends on Backend

If using Assistant Cloud: migrate to official pattern.
If using custom LangGraph: our approach is valid, document as pattern.

---

## 5. Error Handling Comparison

### Our Implementation

**File**: `components/assistant-ui/error-display.tsx`

```typescript
export const ErrorDisplay: FC = () => {
  const { errorState } = useAssistantState();
  // Custom animated error banner
};
```

### Official API

No built-in error display component. Error handling is left to implementer.

### Migration Action: None

This is a custom addition. Could propose as official component.

---

## 6. Event Handlers (New in v0.7+)

### Official API (Not in Our Implementation)

```typescript
const runtime = useLangGraphRuntime({
  eventHandlers: {
    onMessageChunk: (chunk, metadata) => { /* ... */ },
    onValues: (values) => { /* ... */ },
    onUpdates: (updates) => { /* ... */ },
    onMetadata: (metadata) => { /* ... */ },
    onError: (error) => { /* ... */ },
    onCustomEvent: (type, data) => { /* ... */ },
  },
});
```

### Migration Action: Consider Adding

Event handlers could improve our error handling and enable new features.

---

## Summary: Migration Priority

| Item | Priority | Effort | Benefit |
|------|----------|--------|---------|
| Runtime API (v0.7 pattern) | **High** | High | Cleaner code, better thread mgmt |
| Event handlers | **Medium** | Low | Better error handling |
| Suggestions API | **Low** | Medium | Consistency with official |
| Tool Fallback | **Low** | Low | Already feature-rich |
| Thread List | **Depends** | Medium | Only if using Cloud |

---

## Features to Propose Upstream

These features don't exist in official API and could be contributed:

1. **Canvas System** - Rich tool output panel
2. **Error Display Component** - Animated error banner
3. **Auto-scroll Fix Hook** - Better streaming scroll behavior
4. **Message Sanitization** - Handle unsupported content types
5. **Thinking Indicator** - Animated loading state
