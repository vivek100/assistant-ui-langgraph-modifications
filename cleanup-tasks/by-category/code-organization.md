# Code Organization Improvements

Detailed list of code structure and organization improvements.

---

## 1. Remove Duplicate CanvasProvider

**Problem**: CanvasProvider is wrapped at two levels.

**Files**:
- `components/assistant-ui/thread.tsx:42-45`
- `components/MyAssistant.tsx:227`

**Current**:
```typescript
// thread.tsx
export const Thread: FC = () => {
  return (
    <CanvasProvider>
      <CanvasLayout />
    </CanvasProvider>
  );
};

// MyAssistant.tsx
<CanvasProvider>
  <MyAssistantInner ... />
</CanvasProvider>
```

**Fix**: Remove from `thread.tsx`, keep in `MyAssistant.tsx`.

```typescript
// thread.tsx - AFTER
export const Thread: FC = () => {
  return <CanvasLayout />;
};
```

---

## 2. Create Constants File

**Problem**: Magic strings scattered throughout codebase.

**Create**: `lib/constants.ts`

```typescript
// lib/constants.ts
export const THREAD_CONFIG = {
  maxWidth: "48rem",
  paddingX: "1rem",
} as const;

export const CANVAS_CONFIG = {
  width: "min(500px,60vw)",
  openGridCols: "grid-cols-[30%_70%]",
  closedGridCols: "grid-cols-[1fr_0]",
} as const;

export const DEFAULT_SUGGESTIONS = [
  { text: "What can you help me with?" },
  { text: "Write code to demonstrate topological sorting" },
  { text: "Help me write an essay about AI chat applications" },
  { text: "What is the weather in San Francisco?" },
] as const;

export const THREAD_LIST_CONFIG = {
  defaultLimit: 50,
} as const;

export const ERROR_MESSAGES = {
  connectionError: "Failed to contact assistant service.",
  loadThreadFailed: "Unable to load the selected thread.",
  threadNotFound: "Thread not found",
} as const;
```

**Update consumers** to import from constants.

---

## 3. Consolidate Hook Exports

**Problem**: Hooks scattered in different locations.

**Current Structure**:
```
components/assistant-ui/hooks/use-thread-auto-scroll.ts
lib/thread-list-runtime.tsx
```

**Recommended Structure**:
```
lib/hooks/
├── index.ts                    # Re-exports all hooks
├── use-thread-auto-scroll.ts   # Move from components
├── use-thread-list.ts          # Rename from thread-list-runtime
└── use-assistant-state.ts      # Extract from context file
```

**Create**: `lib/hooks/index.ts`

```typescript
export { useThreadAutoScrollFix } from "./use-thread-auto-scroll";
export { useLangGraphThreadList } from "./use-thread-list";
export type { ThreadSummary, UseLangGraphThreadListOptions } from "./use-thread-list";
```

---

## 4. Separate Context from Components

**Problem**: `assistant-state-context.tsx` contains both context and utility functions.

**Current**:
```typescript
// assistant-state-context.tsx contains:
// - ErrorState type
// - AssistantStateContext
// - AssistantStateProvider
// - AssistantErrorBoundary (component)
// - snakeCaseToTitleCase (utility)
```

**Recommended Split**:
```
lib/
├── contexts/
│   ├── assistant-state-context.tsx  # Just context + provider
│   └── index.ts
├── components/
│   └── error-boundary.tsx           # AssistantErrorBoundary
└── utils/
    └── string-utils.ts              # snakeCaseToTitleCase
```

---

## 5. Group Canvas Components

**Problem**: Canvas components split between root and subfolder.

**Current**:
```
components/assistant-ui/
├── canvas-context.tsx
├── canvas-panel.tsx
├── canvas-preview.tsx
├── canvas-renderer.tsx
└── canvas/
    ├── types.ts
    └── renderers/
        ├── default.tsx
        ├── markdown-report.tsx
        └── streamdown.tsx
```

**Recommended**:
```
components/assistant-ui/canvas/
├── index.ts              # Re-exports
├── context.tsx           # Was canvas-context.tsx
├── panel.tsx             # Was canvas-panel.tsx
├── preview.tsx           # Was canvas-preview.tsx
├── renderer.tsx          # Was canvas-renderer.tsx
├── types.ts
└── renderers/
    ├── index.ts
    ├── default.tsx
    ├── markdown-report.tsx
    └── streamdown.tsx
```

**Create**: `components/assistant-ui/canvas/index.ts`

```typescript
export { CanvasProvider, useCanvas, CANVAS_WIDTH } from "./context";
export { CanvasPanel } from "./panel";
export { CanvasPreview } from "./preview";
export type { CanvasPayload, CanvasPayloadBase } from "./types";
```

---

## 6. Create Barrel Exports

**Problem**: Deep imports throughout codebase.

**Current**:
```typescript
import { useAssistantState } from "./assistant-state-context";
import { CanvasProvider } from "./canvas-context";
import { useCanvas } from "./canvas-context";
```

**Create**: `components/assistant-ui/index.ts`

```typescript
// Contexts
export { AssistantStateProvider, useAssistantState } from "./assistant-state-context";
export type { AssistantStateContextType, ErrorState } from "./assistant-state-context";

// Canvas
export { CanvasProvider, useCanvas, CanvasPanel, CanvasPreview } from "./canvas";
export type { CanvasPayload } from "./canvas";

// Components
export { Thread } from "./thread";
export { ThreadList } from "./thread-list";
export { ErrorDisplay } from "./error-display";
export { ToolFallback } from "./tool-fallback";
export { StreamdownText } from "./streamdown-text";
export { ThreadWelcomeSuggestions } from "./thread-welcome-suggestions";

// Hooks
export { useThreadAutoScrollFix } from "./hooks/use-thread-auto-scroll";
```

---

## 7. Separate API Functions by Domain

**Problem**: `chatApi.ts` contains all API functions.

**Current**: Single file with thread, message, and utility functions.

**Recommended Split**:
```
lib/api/
├── index.ts           # Re-exports
├── client.ts          # createClient function
├── threads.ts         # Thread CRUD operations
├── messages.ts        # Message operations
└── utils.ts           # generateThreadTitle, etc.
```

---

## Summary Checklist

| Task | Priority | Effort |
|------|----------|--------|
| Remove duplicate CanvasProvider | High | Low |
| Create constants file | High | Low |
| Consolidate hook exports | Medium | Medium |
| Separate context from components | Medium | Medium |
| Group canvas components | Low | Medium |
| Create barrel exports | Low | Low |
| Separate API functions | Low | Medium |
