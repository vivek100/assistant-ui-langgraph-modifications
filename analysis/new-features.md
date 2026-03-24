# New Features

This document details the new features we added to the assistant-ui LangGraph template.

> **Note**: Additional advanced features exist in `BPMv0/bpmv0Frontend` and `FernDocsAgent/frontend` that build on this base template. See [Additional Features (Advanced Projects)](#additional-features-advanced-projects) at the end.

---

## 1. Canvas System for Rich Tool Outputs

**Purpose**: Display rich, interactive tool results in a side panel instead of inline JSON.

**Components**:
- `canvas-context.tsx` - State management for canvas open/close and payload
- `canvas-panel.tsx` - The side panel that displays tool results
- `canvas-preview.tsx` - Inline preview button that opens the canvas

**File**: `components/assistant-ui/canvas-context.tsx`

```typescript
type CanvasContextValue = {
  open: boolean;
  payload: CanvasPayload | null;
  openCanvas: (payload: CanvasPayload) => void;
  closeCanvas: () => void;
};

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<CanvasPayload | null>(null);

  // Auto-close when tab becomes hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setOpen(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  // ...
}
```

**Layout in thread.tsx**:
```typescript
const CanvasLayout: FC = () => {
  const { open } = useCanvas();
  return (
    <div className={cn(
      "h-full grid",
      open ? "grid-cols-[30%_70%]" : "grid-cols-[1fr_0]"
    )}>
      <ThreadInner />
      {open ? <CanvasPanel /> : null}
    </div>
  );
};
```

**Official API Comparison**: Assistant-ui doesn't have a built-in canvas system. This is a custom addition.

---

## 2. Global Assistant State Context

**Purpose**: Centralized state management for error handling, custom state, and cross-component communication.

**File**: `components/assistant-ui/assistant-state-context.tsx`

```typescript
export type AssistantStateContextType<TCustom = object> = {
  errorState: ErrorState;
  disabled?: boolean;
  threadIdRef?: React.RefObject<string | undefined>;
  setErrorState: Dispatch<SetStateAction<ErrorState>>;
  openNewChat: () => void;
} & TCustom;

export function AssistantStateProvider<TCustom = object>({
  children,
  threadIdRef,
  disabled = false,
  customState,
  customActions,
  onNewChat,
}: AssistantStateProviderProps<TCustom>) {
  const [errorState, setErrorState] = useState<ErrorState>(null);
  // ... merges custom state and actions into context
}
```

**Features**:
- Generic type support for custom state extensions
- Error boundary component (`AssistantErrorBoundary`)
- `openNewChat` action with callback support
- Utility function `snakeCaseToTitleCase`

**Official API Comparison**: Assistant-ui has a Context API but not this specific pattern. Could be proposed as an enhancement.

---

## 3. Error Display Component

**Purpose**: Animated error banner with configurable actions (refresh, new chat, dismiss).

**File**: `components/assistant-ui/error-display.tsx`

```typescript
export const ErrorDisplay: FC = () => {
  const { errorState, setErrorState, openNewChat } = useAssistantState();
  
  if (!errorState) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border-destructive/20 ..."
    >
      <AlertCircle />
      <p>{errorState.title}</p>
      {errorState.showRefresh && <Button onClick={() => window.location.reload()}>Refresh</Button>}
      {errorState.showNewChat && <Button onClick={openNewChat}>New Chat</Button>}
      {errorState.message && <ExpandableDetails />}
    </motion.div>
  );
};
```

**Official API Comparison**: No built-in error display component in assistant-ui.

---

## 4. Welcome Suggestions Component

**Purpose**: Display configurable suggestion buttons on empty thread with animations.

**File**: `components/assistant-ui/thread-welcome-suggestions.tsx`

```typescript
export interface SuggestionItem {
  text: string;
  prompt?: string;  // Optional different prompt than display text
}

export const ThreadWelcomeSuggestions: FC<ThreadWelcomeSuggestionsProps> = ({
  suggestions = DEFAULT_SUGGESTIONS,
}) => {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={`suggested-action-${suggestion.text}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestion.prompt || suggestion.text}
            method="replace"
            autoSend
            asChild
          >
            <Button>{suggestion.text}</Button>
          </ThreadPrimitive.Suggestion>
        </motion.div>
      ))}
    </div>
  );
};
```

**Official API Comparison**: 
- Official has `Suggestions()` API and `ThreadPrimitive.Suggestions` primitive
- Our implementation is similar but with custom animations and styling
- **Should migrate** to use official `Suggestions()` API pattern

---

## 5. User-Based Thread Filtering

**Purpose**: Filter threads by user ID and store custom metadata.

**File**: `lib/chatApi.ts`

```typescript
export const createThread = async (
  userId?: string | null,
  customMetadata?: Record<string, string>
) => {
  const metadata: Metadata = {};
  if (userId) metadata.user_id = userId;
  if (customMetadata) Object.assign(metadata, customMetadata);
  return client.threads.create(hasMetadata ? { metadata } : undefined);
};

export const listThreadsByUser = async (params: {
  userId: string;
  limit?: number;
  additionalMetadata?: Record<string, string>;
}) => {
  return client.threads.search({
    limit: params.limit ?? 50,
    metadata: { user_id: params.userId, ...params.additionalMetadata },
  });
};

export const generateThreadTitle = (message: string): string => {
  // Remove common prefixes, capitalize, truncate to 50 chars
};
```

**File**: `lib/thread-list-runtime.tsx`

```typescript
export function useLangGraphThreadList(options?: UseLangGraphThreadListOptions) {
  const userId = options?.userId;
  
  const refreshThreads = useCallback(async () => {
    let result;
    if (userId) {
      result = await listThreadsByUser({ userId, limit, additionalMetadata });
    } else {
      result = await listThreads({ limit });
    }
    setThreads(result as ThreadSummary[]);
  }, [userId, additionalMetadata, limit]);
  
  return { threads, isLoading, refreshThreads, deleteThreadById };
}
```

**Official API Comparison**: 
- Official v0.7+ has `cloud` option for persistence
- Our approach is custom but works with any LangGraph backend
- Could be proposed as a pattern for non-cloud deployments

---

## 6. Enhanced Tool Fallback UI

**Purpose**: Collapsible tool execution display with JSON viewer for arguments and results.

**File**: `components/assistant-ui/tool-fallback.tsx`

```typescript
export const ToolFallback: FC<ToolFallbackProps> = ({ toolName, argsText, result }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const displayName = snakeCaseToTitleCase(toolName);

  return (
    <div className="rounded-lg border">
      <button onClick={() => setIsCollapsed(!isCollapsed)}>
        <Zap /> {displayName}
        {isRunning ? <Loader2 className="animate-spin" /> : <CheckIcon />}
        {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </button>
      
      {!isCollapsed && (
        <>
          <JsonViewer data={parsedArgs} />
          {result && <JsonViewer data={parsedResult} />}
        </>
      )}
    </div>
  );
};
```

**Official API Comparison**:
- Official has `ToolFallback` component via CLI (`npx assistant-ui add tool-fallback`)
- Our version has similar structure but different styling/behavior
- **Should compare** with official implementation

---

## 7. Thinking Indicator

**Purpose**: Show animated dots when agent is processing.

**File**: `components/assistant-ui/thread.tsx`

```typescript
<ThreadPrimitive.If running>
  <div className="flex items-center gap-2 text-sm">
    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} />
    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
    <span>Agent is thinking…</span>
  </div>
</ThreadPrimitive.If>
```

**Official API Comparison**: Not a standard component, custom addition.

---

---

## 8. Streamdown with Custom Code Block Registry

**Purpose**: Enhanced markdown rendering with pluggable code block handlers for custom UI widgets.

**Files**:
- `components/assistant-ui/streamdown-text.tsx` - Main component with registry
- `components/assistant-ui/register-code-blocks.ts` - Handler registration

**Key Implementation**:

```typescript
// Registry for custom code block handlers
const codeBlockHandlers = new Map<string, CodeBlockHandler>();

/**
 * Register a custom code block handler for a specific language prefix.
 * 
 * @example
 * // Register handler for ```mywidget blocks
 * registerCodeBlockHandler('language-mywidget', MyWidgetCodeBlock);
 * 
 * // Register handler for ```chart:* blocks (prefix match)
 * registerCodeBlockHandler('language-chart:', ChartCodeBlock);
 */
export function registerCodeBlockHandler(
  languagePrefix: string,
  handler: CodeBlockHandler
): void {
  codeBlockHandlers.set(languagePrefix, handler);
}
```

**Custom Code Component** (routes to handlers):

```typescript
const CustomCodeComponent: FC<CodeBlockProps> = (props) => {
  const className = props.className || "";
  
  // Check for exact match first
  if (codeBlockHandlers.has(className)) {
    const Handler = codeBlockHandlers.get(className)!;
    return <Handler {...props} />;
  }
  
  // Check for prefix match (e.g., "language-chart:" matches "language-chart:bar")
  for (const [prefix, Handler] of codeBlockHandlers) {
    if (prefix.endsWith(':') && className.startsWith(prefix)) {
      return <Handler {...props} />;
    }
  }
  
  // Fallback to Streamdown's built-in handlers
  // ...
};
```

**Usage Example** (from BPMv0):

```typescript
// register-code-blocks.ts
import { registerCodeBlockHandler } from "./streamdown-text";
import { SubagentCodeBlock } from "./canvas/renderers/subagent-codeblock";
import { UserFormCodeBlock } from "./canvas/renderers/userform";

export function registerAllCodeBlockHandlers() {
  // Register handler for ```subagent blocks
  registerCodeBlockHandler("language-subagent", SubagentCodeBlock);
  
  // Register handler for ```userform blocks (interactive confirmation forms)
  registerCodeBlockHandler("language-userform", UserFormCodeBlock);
}

// Auto-register on import
registerAllCodeBlockHandlers();
```

**Benefits**:
- Agents can output custom UI widgets via markdown code blocks
- Supports exact match (`language-subagent`) and prefix match (`language-chart:`)
- Falls back to Streamdown's built-in syntax highlighting
- Safe text handling for non-string content

---

## 9. Comprehensive Loading States

**Purpose**: Visual feedback throughout the UI for async operations.

**Locations**:

### Thread List Loading
**File**: `components/assistant-ui/thread-list.tsx`

```typescript
const { threads, isLoading, deleteThreadById } = useLangGraphThreadList({ userId });

// In render:
{isLoading && <div className="text-sm text-muted-foreground px-2">Loading threads...</div>}
```

### Tool Running State
**File**: `components/assistant-ui/tool-fallback.tsx`

```typescript
const isRunning = result === undefined;

{isRunning ? (
  <span className="text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1">
    <Loader2 className="size-3 animate-spin" />
    Running…
  </span>
) : (
  <span className="text-xs inline-flex items-center gap-1 text-emerald-600">
    <CheckIcon className="size-3" />
    Completed
  </span>
)}
```

### Composer State (Running vs Idle)
**File**: `components/assistant-ui/thread.tsx`

```typescript
<ThreadPrimitive.If running={false}>
  <ComposerPrimitive.Input placeholder="Send a message..." />
</ThreadPrimitive.If>

<ThreadPrimitive.If running>
  <ComposerPrimitive.Input placeholder="Agent is thinking..." disabled />
</ThreadPrimitive.If>
```

### Send/Cancel Button Toggle
**File**: `components/assistant-ui/thread.tsx`

```typescript
<ThreadPrimitive.If running={false}>
  <ComposerPrimitive.Send asChild>
    <Button><ArrowUpIcon /></Button>
  </ComposerPrimitive.Send>
</ThreadPrimitive.If>

<ThreadPrimitive.If running>
  <ComposerPrimitive.Cancel asChild>
    <Button className="bg-red-600"><Square /></Button>
  </ComposerPrimitive.Cancel>
</ThreadPrimitive.If>
```

### Avatar Animation
**File**: `components/assistant-ui/thread.tsx`

```typescript
<ThreadPrimitive.If running>
  <motion.div
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1.15, 1] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  >
    <StarIcon size={14} />
  </motion.div>
</ThreadPrimitive.If>
<ThreadPrimitive.If running={false}>
  <StarIcon size={14} />
</ThreadPrimitive.If>
```

### Action Bar Auto-Hide
**File**: `components/assistant-ui/thread.tsx`

```typescript
<ActionBarPrimitive.Root
  hideWhenRunning  // Hides edit/copy buttons while agent is responding
  autohide="not-last"
  autohideFloat="single-branch"
>
```

---

## Summary Table

| Feature | Files | Official Equivalent | Action |
|---------|-------|---------------------|--------|
| Canvas System | `canvas-*.tsx` | None | Propose as feature |
| Assistant State Context | `assistant-state-context.tsx` | Context API | Propose pattern |
| Error Display | `error-display.tsx` | None | Propose as component |
| Welcome Suggestions | `thread-welcome-suggestions.tsx` | `Suggestions()` API | Migrate to official |
| User Thread Filtering | `chatApi.ts`, `thread-list-runtime.tsx` | Cloud persistence | Document as pattern |
| Tool Fallback | `tool-fallback.tsx` | `ToolFallback` component | Compare & align |
| Thinking Indicator | `thread.tsx` | None | Propose as feature |
| **Streamdown Code Registry** | `streamdown-text.tsx` | Streamdown lib | **Propose as pattern** |
| **Loading States** | Multiple files | Partial (primitives) | **Document as pattern** |

---

# Additional Features (Advanced Projects)

The following features were developed in more advanced projects (`BPMv0/bpmv0Frontend` and `FernDocsAgent/frontend`) that build on this base template. These are **not in the base template clone** but represent patterns worth documenting.

---

## 10. Canvas Auto-Open from URL Parameter

**Purpose**: Open canvas with a specific document when navigating via URL (e.g., `/app/chat?documentId=abc123`).

**Projects**: BPMv0, FernDocsAgent

**File**: `components/MyAssistant.tsx` (BPMv0)

```typescript
// Read documentId from URL
const documentId = searchParams.get("documentId") ?? undefined;

// Auto-open canvas with document when documentId is in URL
useEffect(() => {
  if (documentId) {
    const timer = setTimeout(() => {
      const payload = {
        rendererType: 'bpm-document',
        result: { document_id: documentId },
        toolName: 'get_document_info',
        title: 'BPM Document'
      };
      openCanvas(payload);
    }, 400);
    return () => clearTimeout(timer);
  }
}, [documentId, openCanvas]);
```

**FernDocsAgent Pattern** (cleaner with separate component):

```typescript
function AutoOpenCanvas({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const { openCanvas } = useCanvas();
  const openedRef = useRef(false);

  useEffect(() => {
    const documentId = searchParams.get("documentId");
    if (documentId && !openedRef.current) {
      openedRef.current = true;
      setTimeout(() => {
        openCanvas({
          rendererType: "fern-document",
          title: "Fern Document",
          result: { document_id: documentId },
        });
      }, 400);
    }
  }, [searchParams, openCanvas]);

  return <>{children}</>;
}
```

**Use Case**: Deep linking to specific documents, sharing URLs that open specific views.

---

## 11. Auto-Open Canvas on Tool Completion

**Purpose**: Automatically open canvas when certain tools complete successfully (e.g., `create_document`, `apply_json_patch`).

**Projects**: BPMv0, FernDocsAgent

**File**: `components/assistant-ui/canvas-preview.tsx`

```typescript
// Tools that should auto-open canvas when result is received
const AUTO_OPEN_TOOLS = new Set([
  'create_document',
  'apply_json_patch',
  'finalize_structure',
  'save_page_mdx',
]);

// Global tracker to prevent re-opening
const autoOpenedTools = new Set<string>();

useEffect(() => {
  if (result === undefined) return;
  if (autoOpenedTools.has(toolKey)) return;
  if (!AUTO_OPEN_TOOLS.has(toolName)) return;
  if (!isToolSuccess(result)) return;

  autoOpenedTools.add(toolKey);

  // If canvas already open, reload document instead
  if (isCanvasOpen && currentPayload?.rendererType === 'bpm-document') {
    reloadDocument();
    return;
  }

  // Open canvas with delay
  setTimeout(() => openCanvas(payload), 300);
}, [result, toolName, ...]);
```

**Key Features**:
- Tracks which tools have been auto-opened to prevent duplicates
- Reloads document if canvas already showing same type
- Validates tool success before opening

---

## 12. Reference Chips / File Attachments in Composer

**Purpose**: Allow users to select items from the canvas and reference them in messages, displayed as chips above the input.

**Project**: BPMv0 only

**Files**:
- `components/assistant-ui/composer/ComposerWithReferences.tsx`
- `components/assistant-ui/composer/ReferenceChip.tsx`
- `lib/bpm/selectionState.ts` (Zustand store)
- `lib/bpm/referenceParser.ts`

**Selection State Store**:
```typescript
// lib/bpm/selectionState.ts
interface BpmReference {
  id: string;
  layerKey: string;
  layerLabel: string;
  displayName: string;
  path: string;
  documentId?: string;
  itemId?: string;
}

interface SelectionState {
  selectedItems: BpmReference[];
  selectMode: boolean;
  addSelection: (ref: BpmReference) => void;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
  scrollToItem: (id: string) => void;
}
```

**Composer with References**:
```typescript
export function ComposerWithReferences({ ... }) {
  const selectedItems = useSelectionStore((s) => s.selectedItems);
  const clearSelections = useSelectionStore((s) => s.clearSelections);
  
  // Display chips above input
  {hasSelections && (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-gray-50 border rounded-t-2xl">
      <span className="text-xs text-gray-500">Referencing:</span>
      {selectedItems.map(ref => (
        <ReferenceChip
          key={ref.id}
          reference={ref}
          onRemove={() => removeSelection(ref.id)}
          onClick={() => scrollToItem(ref.id)}
        />
      ))}
    </div>
  )}
  
  // On send, format references into message
  const handleSend = () => {
    const finalMessage = formatReferencesForMessage(selectedItems, userText);
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text: finalMessage }],
    });
    clearSelections();
  };
}
```

**Reference Chip Component**:
```typescript
export function ReferenceChip({ reference, onRemove, onClick }) {
  const config = getLayerConfig(reference.layerKey);
  const Icon = config?.icon;
  
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full", config?.badgeClasses)}>
      {Icon && <Icon className="h-3 w-3" />}
      <span className="font-medium">{reference.layerLabel}</span>
      <span className="truncate">{reference.displayName}</span>
      <button onClick={onRemove}><X className="h-3 w-3" /></button>
    </span>
  );
}
```

**Message Format** (parsed by backend):
```
@[Use Case 1](bpm:doc123/use_cases/uc1) @[Module 2](bpm:doc123/modules/m2)

User's actual question about these items...
```

---

## 13. Landing Page Initial Message

**Purpose**: Auto-send a message when navigating from a landing page with a pre-filled prompt.

**Project**: BPMv0

**File**: `components/MyAssistant.tsx`

```typescript
// Read from sessionStorage (set by landing page)
const [landingMessage, setLandingMessage] = useState<string | null>(null);
useEffect(() => {
  const msg = sessionStorage.getItem("landing_initial_message");
  if (msg) setLandingMessage(msg);
}, []);

// Auto-send via composer runtime
useEffect(() => {
  if (!landingMessage || didSendRef.current) return;
  didSendRef.current = true;
  
  // Retry loop since composer may not be ready immediately
  const trySend = () => {
    try {
      composerRuntime.setText(landingMessage);
      composerRuntime.send();
      sessionStorage.removeItem("landing_initial_message");
    } catch {
      // Retry...
    }
  };
  
  setTimeout(trySend, 1500);
}, [landingMessage]);
```

---

## 14. Tool Group Context & Display

**Purpose**: Group related tool calls together in the UI (e.g., all tools from a subagent).

**Projects**: BPMv0, FernDocsAgent

**Files**:
- `components/assistant-ui/tool-group-context.tsx`
- `components/assistant-ui/tool-group-wrapper.tsx`
- `components/assistant-ui/tool-group-display.tsx`

**Pattern**: Wraps tool calls in a collapsible group with shared state.

---

## 15. Canvas Renderer Registry

**Purpose**: Pluggable renderer system for different tool result types.

**Projects**: BPMv0, FernDocsAgent

**Files**:
- `components/assistant-ui/canvas/registry.ts`
- `components/assistant-ui/canvas/toolRendererMap.ts`
- `components/assistant-ui/canvas/renderers/` (many renderers)

```typescript
// toolRendererMap.ts - Maps tool names to renderer types
const TOOL_RENDERER_MAP: Record<string, string> = {
  'create_document': 'bpm-document',
  'apply_json_patch': 'bpm-document',
  'get_api_summary': 'fern-document',
  // ...
};

// registry.ts - Registers renderer components
registerRenderer('bpm-document', BpmDocumentRenderer);
registerRenderer('fern-document', FernDocumentRenderer);
```

---

## Summary: Advanced Features

| Feature | Project | Key Files | Complexity |
|---------|---------|-----------|------------|
| Canvas from URL | Both | `MyAssistant.tsx` | Low |
| Auto-open on tool complete | Both | `canvas-preview.tsx` | Medium |
| Reference chips | BPMv0 | `composer/`, `selectionState.ts` | High |
| Landing page message | BPMv0 | `MyAssistant.tsx` | Low |
| Tool group display | Both | `tool-group-*.tsx` | Medium |
| Renderer registry | Both | `canvas/registry.ts` | Medium |

---

## Recommendation

For sharing with the assistant-ui team, prioritize:

1. **Canvas from URL** - Simple, high value, easy to upstream
2. **Auto-open on tool complete** - Common pattern, worth standardizing
3. **Renderer registry** - Good architecture pattern

The **reference chips** feature is very domain-specific (BPM) but the pattern could be generalized for any "attachment" or "context" system.
