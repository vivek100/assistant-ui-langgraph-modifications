# Changelog: Modified Assistant-UI LangGraph Template

This document tracks all changes made to the original `assistant-ui-starter-langgraph` template.

**Base Version**: Original template from `npx assistant-ui@latest create -t langgraph`  
**Our Version**: `@assistant-ui/react-langgraph@0.5.11`  
**Latest Official**: `@assistant-ui/react-langgraph@0.7+` (new simplified API)

---

## Files Changed (24 files, +1489/-6381 lines)

| File | Change Type | Description |
|------|-------------|-------------|
| `components/MyAssistant.tsx` | **Major Rewrite** | Added state management, error handling, URL sync, user filtering |
| `components/assistant-ui/thread.tsx` | **Major Rewrite** | Canvas integration, auto-scroll fix, thinking indicator |
| `components/assistant-ui/assistant-state-context.tsx` | **New File** | Global state context with error boundary |
| `components/assistant-ui/error-display.tsx` | **New File** | Animated error banner component |
| `components/assistant-ui/hooks/use-thread-auto-scroll.ts` | **New File** | Auto-scroll behavior fix |
| `components/assistant-ui/thread-welcome-suggestions.tsx` | **New File** | Configurable welcome suggestions |
| `components/assistant-ui/canvas-context.tsx` | **Modified** | Canvas state management |
| `components/assistant-ui/canvas-panel.tsx` | **Modified** | Rich tool output panel |
| `components/assistant-ui/canvas-preview.tsx` | **Modified** | Inline canvas preview |
| `components/assistant-ui/tool-fallback.tsx` | **Major Rewrite** | Collapsible tool UI with JSON viewer |
| `components/assistant-ui/json-viewer.tsx` | **New File** | JSON data viewer component |
| `components/assistant-ui/streamdown-text.tsx` | **Modified** | Enhanced markdown with code blocks |
| `components/assistant-ui/thread-list.tsx` | **Modified** | User-filtered thread list |
| `lib/chatApi.ts` | **Major Rewrite** | User metadata, thread filtering, title generation |
| `lib/sanitizeMessages.ts` | **New File** | Message content sanitization |
| `lib/thread-list-runtime.tsx` | **Modified** | User-based thread list hook |

---

## Detailed Changes by Category

### 1. Bug Fixes
- Auto-scroll not working during streaming → `use-thread-auto-scroll.ts`
- UI crash on unsupported content types → `sanitizeMessages.ts`
- Thread state loading errors → Error handling in `MyAssistant.tsx`

### 2. New Features
- Canvas system for rich tool outputs
- Global error state with animated banner
- User-based thread filtering
- Thread title auto-generation
- Welcome suggestions with animations
- Enhanced tool fallback with collapse/expand

### 3. Infrastructure
- AssistantStateProvider context
- AssistantErrorBoundary wrapper
- URL-based thread persistence
- Suspense boundary for SSR compatibility

---

## Git Commit History

```
6861898 docs: document user-based thread filtering and metadata
9df8599 docs: update README and enhance assistant UI template
04fa45f fixed UI
c6fce2f fixed build errors
d20f026 fixed install command
ef592b5 fixed install command
58b315d fixed lock file
c77cbf0 first commit
```

---

## Additional Features in Advanced Projects

The base template (`testv0.05/assistant-ui-starter-langgraph-main`) was further extended in:

### BPMv0/bpmv0Frontend
- Canvas auto-open from URL (`?documentId=xxx`)
- Auto-open canvas on tool completion
- Reference chips / file attachments in composer
- Landing page initial message auto-send
- Tool group context & display
- Canvas renderer registry with 50+ renderers
- BPM document viewer with Zustand state

### FernDocsAgent/frontend
- Canvas auto-open from URL
- Auto-open canvas on tool completion  
- Tool group context & display
- Fern document tabbed viewer
- Canvas renderer registry

See `analysis/new-features.md` for detailed documentation of these features.
