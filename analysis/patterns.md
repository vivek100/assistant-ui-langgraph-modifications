# Coding Patterns Analysis

This document analyzes the coding patterns used in our modified template - both good patterns worth sharing and areas that need improvement.

---

## Good Patterns ✅

### 1. Ref + State Synchronization for Thread ID

**Pattern**: Using both a ref and state for thread ID to handle async operations correctly.

**File**: `components/MyAssistant.tsx:67-69`

```typescript
const [activeThreadId, setActiveThreadId] = useState<string | undefined>(initialThreadId);
const threadIdRef = useRef<string | undefined>(initialThreadId);
```

**Why It's Good**:
- State triggers re-renders when thread changes
- Ref provides stable reference for async callbacks (stream function)
- Prevents stale closure issues in async operations

**Caveat**: Requires manual sync between ref and state.

---

### 2. Generic Context with Type Extensions

**Pattern**: Context provider that accepts generic type parameter for custom state.

**File**: `components/assistant-ui/assistant-state-context.tsx:36-38`

```typescript
export type AssistantStateContextType<TCustom = object> = AssistantStateBase &
  AssistantStateActions &
  TCustom;

export function useAssistantState<TCustom = object>(): AssistantStateContextType<TCustom> {
  const context = useContext(AssistantStateContext);
  return context as AssistantStateContextType<TCustom>;
}
```

**Why It's Good**:
- Type-safe custom state extensions
- Reusable across different projects
- Maintains base functionality while allowing customization

---

### 3. Suspense Boundary for useSearchParams

**Pattern**: Wrapping component that uses `useSearchParams` in Suspense.

**File**: `components/MyAssistant.tsx:41-46`

```typescript
export function MyAssistant(props: MyAssistantProps = {}) {
  return (
    <Suspense fallback={<AssistantLoadingFallback />}>
      <MyAssistantWithSearchParams {...props} />
    </Suspense>
  );
}
```

**Why It's Good**:
- Required for Next.js App Router SSR compatibility
- Provides loading state during hydration
- Prevents hydration mismatch errors

---

### 4. Error Boundary with Context Integration

**Pattern**: Class-based error boundary that works with functional context.

**File**: `components/assistant-ui/assistant-state-context.tsx:120-152`

```typescript
export class AssistantErrorBoundary extends React.Component<...> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AssistantErrorBoundary] caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI />;
    }
    return this.props.children;
  }
}
```

**Why It's Good**:
- Catches render errors that hooks can't catch
- Customizable fallback UI
- Logs errors for debugging

---

### 5. Callback Memoization with Dependencies

**Pattern**: Proper use of useCallback with correct dependency arrays.

**File**: `lib/thread-list-runtime.tsx:44-72`

```typescript
const refreshThreads = useCallback(async () => {
  try {
    setIsLoading(true);
    let result;
    if (userId) {
      result = await listThreadsByUser({ userId, limit, additionalMetadata });
    } else {
      result = await listThreads({ limit });
    }
    setThreads(result as ThreadSummary[]);
  } finally {
    setIsLoading(false);
  }
}, [userId, additionalMetadata, limit]);
```

**Why It's Good**:
- Prevents unnecessary re-creations
- Correct dependencies ensure fresh data
- Try-finally ensures loading state is always reset

---

## Areas for Improvement ⚠️

### 1. Type Safety: `any` Types

**Problem**: Multiple uses of `any` type that reduce type safety.

**File**: `lib/sanitizeMessages.ts:26-28`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;
```

**Improvement**: Define proper types for LangChain messages.

```typescript
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

type MessageContent = string | ContentPart[];
type ContentPart = { type: string; text?: string; [key: string]: unknown };
```

---

### 2. Inconsistent Error Handling

**Problem**: Some async operations have try-catch, others don't.

**File**: `lib/chatApi.ts` - `updateThreadMetadata` is fire-and-forget without error handling in caller.

**File**: `components/MyAssistant.tsx:132`

```typescript
// Fire and forget - errors are swallowed
updateThreadMetadata(threadId, { title }).catch(console.error);
```

**Improvement**: Consistent error handling strategy.

```typescript
// Option 1: Silent fail with logging (current)
updateThreadMetadata(threadId, { title }).catch(console.error);

// Option 2: Track in state for potential retry
try {
  await updateThreadMetadata(threadId, { title });
} catch (e) {
  // Could queue for retry or show non-blocking notification
}
```

---

### 3. Magic Strings

**Problem**: Hardcoded strings scattered throughout.

**File**: `components/assistant-ui/thread.tsx:80-82`

```typescript
style={{
  ["--thread-max-width" as string]: "48rem",
  ["--thread-padding-x" as string]: "1rem",
}}
```

**Improvement**: Centralize configuration.

```typescript
// lib/constants.ts
export const THREAD_CONFIG = {
  maxWidth: "48rem",
  paddingX: "1rem",
} as const;
```

---

### 4. Component Prop Drilling

**Problem**: Props passed through multiple levels.

**File**: `components/MyAssistant.tsx` → `MyAssistantInner` → `Thread` → `Composer`

```typescript
// suggestions prop drilled through 3 levels
<MyAssistantInner suggestions={suggestions} ... />
  <Thread />  // doesn't use suggestions directly
    <Composer suggestions={suggestions} />
```

**Improvement**: Use context for deeply nested props.

```typescript
// Create SuggestionsContext or use existing AssistantStateContext
const { suggestions } = useAssistantState();
```

---

### 5. Duplicate Provider Wrapping

**Problem**: CanvasProvider wrapped at multiple levels.

**File**: `components/assistant-ui/thread.tsx:42-45` AND `components/MyAssistant.tsx:227`

```typescript
// In thread.tsx
export const Thread: FC = () => {
  return (
    <CanvasProvider>
      <CanvasLayout />
    </CanvasProvider>
  );
};

// In MyAssistant.tsx
<CanvasProvider>
  <MyAssistantInner ... />
</CanvasProvider>
```

**Improvement**: Single provider at top level, remove from Thread.

---

### 6. Missing Loading States

**Problem**: Some async operations don't show loading indicators.

**File**: `components/MyAssistant.tsx` - Thread switching has no loading state.

**Improvement**: Add loading state to context.

```typescript
const [isLoadingThread, setIsLoadingThread] = useState(false);

onSwitchToThread: async (threadId) => {
  setIsLoadingThread(true);
  try {
    // ... load thread
  } finally {
    setIsLoadingThread(false);
  }
}
```

---

### 7. Inline Styles vs CSS Classes

**Problem**: Mix of inline styles and Tailwind classes.

**File**: `components/assistant-ui/thread.tsx:56-57`

```typescript
style={{ transition: "grid-template-columns 200ms ease" }}
```

**Improvement**: Use Tailwind's transition utilities or CSS modules.

```typescript
className="transition-[grid-template-columns] duration-200 ease-out"
```

---

## Pattern Recommendations for Team

### Do's ✅
1. Use refs for values needed in async callbacks
2. Wrap search params usage in Suspense
3. Memoize callbacks with correct dependencies
4. Use error boundaries for render error recovery
5. Provide loading states for async operations

### Don'ts ❌
1. Don't use `any` - define proper types
2. Don't drill props more than 2 levels - use context
3. Don't duplicate providers at multiple levels
4. Don't mix inline styles with utility classes
5. Don't swallow errors silently without logging
