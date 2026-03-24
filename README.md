# Assistant-UI LangGraph Template - Modifications Report

> **For the Assistant-UI Team**: This document summarizes our modifications to the `assistant-ui-starter-langgraph` template. We've documented bug fixes, new features, and patterns that may be useful for the main project.

---

## 📋 Quick Navigation

| Document | Description |
|----------|-------------|
| [**Bug Fixes**](./analysis/bugs-fixed.md) | 4 bugs fixed with root cause analysis and code |
| [**New Features**](./analysis/new-features.md) | 17 features added (9 base + 8 advanced) |
| [**Coding Patterns**](./analysis/patterns.md) | Good patterns & areas for improvement |
| [**API Comparison**](./analysis/api-comparison.md) | Our impl vs official v0.7+ APIs |
| [**Cleanup TODO**](./cleanup-tasks/TODO.md) | Prioritized tasks for upstream contribution |
| [**Template Clone**](./template-clone/) | Clean copy with improvements applied |

---

## 🐛 Bug Fixes (4 items)

| # | Bug | Root Cause | Solution | File |
|---|-----|------------|----------|------|
| 1 | Auto-scroll breaks during streaming | Built-in scroll doesn't detect manual scroll-up | Custom hook tracking scroll position | [`use-thread-auto-scroll.ts`](./analysis/bugs-fixed.md#1-auto-scroll-not-working-during-streaming) |
| 2 | UI crash on certain message types | Unsupported content parts (reasoning, tool_use) | Message sanitization filter | [`sanitizeMessages.ts`](./analysis/bugs-fixed.md#2-ui-crash-on-unsupported-content-types) |
| 3 | Thread load errors crash app | No error handling in `onSwitchToThread` | Try-catch with error state | [`MyAssistant.tsx`](./analysis/bugs-fixed.md#3-thread-state-loading-errors) |
| 4 | Stream errors not shown to user | Errors thrown but not displayed | Error state + banner component | [`MyAssistant.tsx`](./analysis/bugs-fixed.md#4-stream-connection-error-handling) |

**→ [Full details with code snippets](./analysis/bugs-fixed.md)**

---

## ✨ New Features (17 items)

### Base Template Features (9)

| # | Feature | Purpose | Key Files |
|---|---------|---------|-----------|
| 1 | [Canvas System](./analysis/new-features.md#1-canvas-system-for-rich-tool-outputs) | Rich tool output side panel | `canvas-context.tsx`, `canvas-panel.tsx` |
| 2 | [Global State Context](./analysis/new-features.md#2-global-assistant-state-context) | Shared state + error handling | `assistant-state-context.tsx` |
| 3 | [Error Display](./analysis/new-features.md#3-error-display-component) | Animated error banner | `error-display.tsx` |
| 4 | [Welcome Suggestions](./analysis/new-features.md#4-welcome-suggestions) | Configurable suggestion buttons | `thread-welcome-suggestions.tsx` |
| 5 | [User Thread Filtering](./analysis/new-features.md#5-user-based-thread-filtering) | Filter threads by user_id | `chatApi.ts`, `thread-list-runtime.tsx` |
| 6 | [Enhanced Tool Fallback](./analysis/new-features.md#6-enhanced-tool-fallback-ui) | Collapsible tool UI with JSON viewer | `tool-fallback.tsx` |
| 7 | [Thinking Indicator](./analysis/new-features.md#7-thinking-indicator) | Animated "Agent is thinking..." | `thread.tsx` |
| 8 | [Streamdown Code Registry](./analysis/new-features.md#8-streamdown-with-custom-code-block-registry) | Pluggable code block handlers | `streamdown-text.tsx` |
| 9 | [Loading States](./analysis/new-features.md#9-comprehensive-loading-states) | Visual feedback for async ops | Multiple files |

### Advanced Features (8) - from BPMv0 & FernDocsAgent

| # | Feature | Purpose | Key Files |
|---|---------|---------|-----------|
| 10 | [Canvas from URL](./analysis/new-features.md#10-canvas-auto-open-from-url-parameter) | Deep link to open canvas | `MyAssistant.tsx` |
| 11 | [Auto-open on Tool Complete](./analysis/new-features.md#11-auto-open-canvas-on-tool-completion) | Auto-show canvas when tools finish | `canvas-preview.tsx` |
| 12 | [Reference Chips](./analysis/new-features.md#12-reference-chips--file-attachments-in-composer) | Select items as message attachments | `composer/`, `lib/references/` |
| 13 | [Landing Page Message](./analysis/new-features.md#13-landing-page-initial-message) | Auto-send from landing page | `MyAssistant.tsx` |
| 14 | [Tool Group Display](./analysis/new-features.md#14-tool-group-context--display) | Group related tool calls | `tool-group-*.tsx` |
| 15 | [Renderer Registry](./analysis/new-features.md#15-canvas-renderer-registry) | Pluggable canvas renderers | `canvas/registry.ts` |
| 16 | [UserForm Code Block](./analysis/new-features.md#16-userform-code-block-generative-ui-with-send-as-message) | **Generative UI with send-as-message** | `userform/` |
| 17 | [Canvas Highlighting](./analysis/new-features.md#17-canvas-item-highlighting-scroll-to--flash) | Scroll-to & flash canvas items | `SelectableItemWrapper.tsx` |

**→ [Full details with code snippets](./analysis/new-features.md)**

---

## 🔄 API Comparison

| Aspect | Our Version | Official v0.7+ | Migration Needed |
|--------|-------------|----------------|------------------|
| Package | `@assistant-ui/react-langgraph@0.5.11` | `@0.7+` | **Yes** |
| Thread creation | Manual in `stream` callback | `create` callback | **Yes** |
| Thread loading | `onSwitchToThread` | `load` callback | **Yes** |
| Stream function | Returns Promise | Generator (`yield*`) | **Yes** |
| Suggestions | Custom component | `Suggestions()` API | Optional |
| Tool Fallback | Custom (more features) | Official component | Keep ours |

**→ [Full comparison with migration guide](./analysis/api-comparison.md)**

---

## 📁 Folder Structure

```
langgraohassistantui/
├── README.md                      ← You are here
├── CHANGELOG.md                   # All changes vs original
├── analysis/
│   ├── bugs-fixed.md             # Bug fixes (4 items)
│   ├── new-features.md           # Features (13 items)
│   ├── patterns.md               # Code patterns review
│   └── api-comparison.md         # Official API comparison
├── cleanup-tasks/
│   ├── TODO.md                   # Prioritized task list
│   └── by-category/
│       ├── type-safety.md        # TypeScript improvements
│       ├── code-organization.md  # Structure improvements
│       └── api-alignment.md      # v0.7 migration tasks
└── template-clone/               # Clean copy with improvements
    ├── components/
    │   └── assistant-ui/
    │       └── composer/         # NEW: Reference chips feature
    └── lib/
        ├── constants.ts          # NEW: Centralized config
        ├── error-utils.ts        # NEW: Error handling utils
        └── references/           # NEW: Reference system
```

---

## 🚀 Upstream Contribution Candidates

Features we think could benefit the main project:

| Priority | Feature | Type | Effort |
|----------|---------|------|--------|
| **High** | Auto-scroll fix | Bug fix | Low |
| **High** | Message sanitization | Bug fix | Low |
| **High** | Error display component (thread loading, stream, tool errors) | New component | Medium |
| **High** | Streamdown code block registry (pluggable custom widgets) | Pattern | Low |
| **High** | **UserForm code block (generative UI → send as message)** | **Pattern** | **Medium** |
| **Medium** | Loading states pattern (tool running, composer, avatar) | Pattern | Low |
| **Medium** | Canvas system | New feature | High |
| **Medium** | Canvas from URL | Enhancement | Low |
| **Medium** | Canvas item highlighting (scroll-to & flash) | Pattern | Low |
| **Low** | Reference chips (attachment chips in input like Cursor) | New feature | High |

---

## 📞 Contact

Questions about any of these modifications? Check the detailed docs linked above, or reach out to discuss patterns and implementation details.

---

## Quick Start (Template Clone)

```bash
cd template-clone
npm install
npm run dev
```

The template clone includes all bug fixes and base features. Advanced features (reference chips, etc.) are included but may need additional setup for your specific use case.
