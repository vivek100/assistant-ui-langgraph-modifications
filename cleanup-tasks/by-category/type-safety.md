# Type Safety Improvements

Detailed list of TypeScript improvements needed in the codebase.

---

## 1. Replace `any` Types in sanitizeMessages.ts

**File**: `lib/sanitizeMessages.ts:26-28`

**Current**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;
```

**Recommended**:
```typescript
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

type ContentPart = {
  type: string;
  text?: string;
  image_url?: string;
  [key: string]: unknown;
};

type MessageContent = string | ContentPart[];

type SanitizableMessage = {
  type: "human" | "ai" | "tool" | "system";
  content: MessageContent;
  [key: string]: unknown;
};
```

---

## 2. Fix Type Assertions in assistant-state-context.tsx

**File**: `components/assistant-ui/assistant-state-context.tsx:49, 103`

**Current**:
```typescript
return context as AssistantStateContextType<TCustom>;
// ...
<AssistantStateContext.Provider value={value as AssistantStateContextType}>
```

**Issue**: Unsafe type assertions that bypass TypeScript checks.

**Recommended**: Use proper generic constraints or runtime validation.

```typescript
// Option 1: Stricter generic constraint
export function useAssistantState<TCustom extends Record<string, unknown> = Record<string, never>>(): AssistantStateContextType<TCustom> {
  const context = useContext(AssistantStateContext);
  if (!context) {
    throw new Error("useAssistantState must be used within AssistantStateProvider");
  }
  // Type assertion is safer with constraint
  return context as AssistantStateContextType<TCustom>;
}

// Option 2: Create typed context factory
function createAssistantStateContext<TCustom>() {
  return createContext<AssistantStateContextType<TCustom> | undefined>(undefined);
}
```

---

## 3. Add Types for Canvas Payload

**File**: `components/assistant-ui/canvas-context.tsx:7`

**Current**:
```typescript
export type CanvasPayload = CanvasPayloadBase;
```

**Check**: Verify `CanvasPayloadBase` in `canvas/types.ts` has complete type definitions.

**Recommended** (if missing):
```typescript
export interface CanvasPayloadBase {
  type: "markdown" | "json" | "code" | "custom";
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface MarkdownCanvasPayload extends CanvasPayloadBase {
  type: "markdown";
}

export interface JsonCanvasPayload extends CanvasPayloadBase {
  type: "json";
  data: unknown;
}

export type CanvasPayload = MarkdownCanvasPayload | JsonCanvasPayload;
```

---

## 4. Fix Error Type in MyAssistant.tsx

**File**: `components/MyAssistant.tsx:144-146, 181`

**Current**:
```typescript
} catch (err: unknown) {
  const msg = (err as Error)?.message || "Failed to contact assistant service.";
```

**Recommended**: Create error utility.

```typescript
// lib/error-utils.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

// Usage
} catch (err: unknown) {
  const msg = getErrorMessage(err);
```

---

## 5. Add Return Types to Functions

**File**: `lib/chatApi.ts`

**Current**:
```typescript
export const createThread = async (
  userId?: string | null,
  customMetadata?: Record<string, string>
) => {
```

**Recommended**:
```typescript
import type { Thread } from "@langchain/langgraph-sdk";

export const createThread = async (
  userId?: string | null,
  customMetadata?: Record<string, string>
): Promise<Thread> => {
```

---

## 6. Type the Event Handler in use-thread-auto-scroll.ts

**File**: `components/assistant-ui/hooks/use-thread-auto-scroll.ts:43`

**Current**:
```typescript
const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
```

**This is correct** ✅ - already properly typed.

---

## 7. Add Discriminated Union for ErrorState

**File**: `components/assistant-ui/assistant-state-context.tsx:15-20`

**Current**:
```typescript
export type ErrorState = {
  title: string;
  message?: string;
  showRefresh?: boolean;
  showNewChat?: boolean;
} | null;
```

**Recommended**: More explicit error types.

```typescript
export type ErrorSeverity = "error" | "warning" | "info";

export interface BaseErrorState {
  title: string;
  message?: string;
  severity?: ErrorSeverity;
}

export interface RecoverableError extends BaseErrorState {
  recoverable: true;
  showRefresh?: boolean;
  showNewChat?: boolean;
  onRetry?: () => void;
}

export interface FatalError extends BaseErrorState {
  recoverable: false;
  showRefresh: true;
}

export type ErrorState = RecoverableError | FatalError | null;
```

---

## Summary Checklist

- [ ] Replace `any` in `sanitizeMessages.ts`
- [ ] Fix type assertions in `assistant-state-context.tsx`
- [ ] Complete canvas payload types
- [ ] Create `lib/error-utils.ts` for error handling
- [ ] Add explicit return types to `chatApi.ts` functions
- [ ] Consider discriminated union for `ErrorState`
