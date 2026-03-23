# API Alignment Tasks

Detailed tasks to align our implementation with official assistant-ui APIs.

---

## 1. Migrate to v0.7 Runtime API (HIGH PRIORITY)

### Current Implementation

**File**: `components/MyAssistant.tsx`

```typescript
const runtime = useLangGraphRuntime({
  threadId: activeThreadId,
  stream: async (messages, { command }) => {
    // Manual thread creation inside stream
    if (!threadIdRef.current) {
      const { thread_id } = await createThread(userId, threadMetadata);
      threadIdRef.current = thread_id;
    }
    return await sendMessage({ threadId, messages, command, userId });
  },
  onSwitchToNewThread: async () => { /* ... */ },
  onSwitchToThread: async (threadId) => { /* ... */ },
});
```

### Target Implementation (v0.7+)

```typescript
const runtime = useLangGraphRuntime({
  // Stream is now a generator function
  stream: async function* (messages, { initialize, command, abortSignal }) {
    const { externalId } = await initialize();
    if (!externalId) throw new Error("Thread not found");
    
    const generator = await sendMessage({
      threadId: externalId,
      messages,
      command,
      userId,
      customConfig: threadMetadata,
    });
    
    yield* generator;
  },
  
  // Separate create callback
  create: async () => {
    const { thread_id } = await createThread(userId, threadMetadata);
    return { externalId: thread_id };
  },
  
  // Separate load callback
  load: async (externalId) => {
    const state = await getThreadState(externalId);
    return {
      messages: sanitizeMessages(state.values.messages || []),
      interrupts: state.tasks?.[0]?.interrupts,
    };
  },
  
  // Optional delete callback
  delete: async (threadId) => {
    await deleteThread(threadId);
  },
  
  // Optional event handlers
  eventHandlers: {
    onError: (error) => {
      setErrorState({
        title: "Stream Error",
        message: error.message,
        showRefresh: true,
        showNewChat: true,
      });
    },
  },
});
```

### Migration Steps

1. **Update package.json**:
   ```json
   "@assistant-ui/react-langgraph": "^0.7.0"
   ```

2. **Update sendMessage to return generator**:
   ```typescript
   // lib/chatApi.ts
   export const sendMessage = async function* (params: {...}) {
     const client = createClient();
     const stream = client.runs.stream(...);
     yield* stream;
   };
   ```

3. **Remove manual thread ID tracking**:
   - Remove `threadIdRef`
   - Remove `activeThreadId` state (runtime manages this)
   - Remove URL sync logic (or use runtime's thread ID)

4. **Remove deprecated callbacks**:
   - Remove `onSwitchToNewThread`
   - Remove `onSwitchToThread`
   - Remove `threadId` prop

5. **Add new callbacks**:
   - Add `create`
   - Add `load`
   - Add `delete` (optional)

6. **Test thoroughly**:
   - New thread creation
   - Thread switching
   - Thread loading on page refresh
   - Error handling

---

## 2. Add Event Handlers (MEDIUM PRIORITY)

### Current: No event handlers

### Target:

```typescript
eventHandlers: {
  onMessageChunk: (chunk, metadata) => {
    // Could use for analytics or debugging
    console.debug("[chunk]", chunk.type, metadata);
  },
  onValues: (values) => {
    // React to state updates
  },
  onUpdates: (updates) => {
    // React to graph updates
  },
  onMetadata: (metadata) => {
    // Thread metadata updates
  },
  onError: (error) => {
    setErrorState({
      title: "Stream Error",
      message: error.message,
      showRefresh: true,
      showNewChat: true,
    });
  },
  onCustomEvent: (type, data) => {
    // Handle custom events from backend
  },
},
```

---

## 3. Consider Suggestions API Migration (LOW PRIORITY)

### Current Implementation

```typescript
// Props-based approach
<ThreadWelcomeSuggestions suggestions={suggestions} />

// Uses ThreadPrimitive.Suggestion directly
<ThreadPrimitive.Suggestion prompt={...} method="replace" autoSend>
```

### Official API

```typescript
// Configuration-based approach
const aui = useAui({
  suggestions: Suggestions([
    "What can you help me with?",
    { title: "Weather", label: "Get weather", prompt: "What's the weather?" },
  ]),
});

// Uses ThreadPrimitive.Suggestions iterator
<ThreadPrimitive.Suggestions>
  {() => (
    <SuggestionPrimitive.Trigger send clearComposer asChild>
      <button><SuggestionPrimitive.Title /></button>
    </SuggestionPrimitive.Trigger>
  )}
</ThreadPrimitive.Suggestions>
```

### Decision: Keep Current or Migrate?

**Keep Current If**:
- Custom animations are important
- Need fine-grained control over suggestion rendering
- Don't want to add `useAui` dependency

**Migrate If**:
- Want to align with official patterns
- Planning to use other `useAui` features (tools, etc.)
- Want automatic suggestion management

---

## 4. Consider Cloud Persistence (DEPENDS ON BACKEND)

### Current: Custom LangGraph SDK calls

```typescript
// Manual thread management
const { thread_id } = await createThread(userId, metadata);
const threads = await listThreadsByUser({ userId });
```

### Official: Assistant Cloud

```typescript
const runtime = useLangGraphRuntime({
  cloud: new AssistantCloud({
    baseUrl: process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL,
    // Authentication handled by cloud
  }),
  // ... other options
});
```

### Decision: When to Use Cloud?

**Use Cloud If**:
- Want managed persistence
- Need cross-device sync
- Want built-in authentication
- Don't want to manage thread storage

**Keep Custom If**:
- Using self-hosted LangGraph
- Need custom metadata filtering
- Have existing thread storage
- Need offline support

---

## 5. Align Tool Fallback Props (LOW PRIORITY)

### Current

```typescript
interface ToolFallbackProps {
  toolName: string;
  argsText: string;  // String that needs parsing
  result?: unknown;
}
```

### Official

```typescript
interface ToolFallbackProps {
  toolName: string;
  args: Record<string, unknown>;  // Already parsed
  result?: unknown;
}
```

### Migration

Update component to accept both for compatibility:

```typescript
interface ToolFallbackProps {
  toolName: string;
  args?: Record<string, unknown>;
  argsText?: string;  // Deprecated, for backwards compat
  result?: unknown;
}

export const ToolFallback: FC<ToolFallbackProps> = ({ toolName, args, argsText, result }) => {
  const parsedArgs = args ?? (argsText ? JSON.parse(argsText) : {});
  // ...
};
```

---

## Summary: Migration Checklist

### Must Do (Before v1.0)
- [ ] Migrate to v0.7 runtime API
- [ ] Update `@assistant-ui/react-langgraph` package
- [ ] Convert stream to generator function
- [ ] Add `create`, `load`, `delete` callbacks
- [ ] Remove deprecated `onSwitchTo*` callbacks

### Should Do (For Polish)
- [ ] Add event handlers for better error handling
- [ ] Align tool fallback props with official

### Consider (Based on Requirements)
- [ ] Migrate to Suggestions API
- [ ] Migrate to Assistant Cloud
- [ ] Use `useAui` for configuration

### Keep As-Is (Custom Features)
- Canvas system (no official equivalent)
- Error display component (no official equivalent)
- Auto-scroll fix (could propose upstream)
- Message sanitization (could propose upstream)
