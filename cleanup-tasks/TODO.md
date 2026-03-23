# Cleanup Tasks TODO

Prioritized list of tasks to prepare this template for upstream contribution and team collaboration.

---

## Priority 1: Critical (Before Sharing)

### 1.1 Migrate to v0.7 Runtime API
- [ ] Update `@assistant-ui/react-langgraph` to v0.7+
- [ ] Refactor `MyAssistant.tsx` to use new API pattern (`create`, `load`, `initialize`)
- [ ] Convert stream function to generator pattern
- [ ] Remove manual thread ID ref tracking
- [ ] Test thread switching, creation, and loading

**Files**: `components/MyAssistant.tsx`, `package.json`  
**Effort**: High  
**Reference**: `analysis/api-comparison.md`

### 1.2 Fix Type Safety Issues
- [ ] Replace `any` types in `sanitizeMessages.ts` with proper LangChain types
- [ ] Add proper types for canvas payload
- [ ] Fix type assertions in `assistant-state-context.tsx`

**Files**: `lib/sanitizeMessages.ts`, `components/assistant-ui/canvas/types.ts`  
**Effort**: Medium  
**Reference**: `analysis/patterns.md`

### 1.3 Remove Duplicate CanvasProvider
- [ ] Remove CanvasProvider from `thread.tsx`
- [ ] Keep only the one in `MyAssistant.tsx`
- [ ] Verify canvas still works correctly

**Files**: `components/assistant-ui/thread.tsx`, `components/MyAssistant.tsx`  
**Effort**: Low

---

## Priority 2: Important (For Clean Contribution)

### 2.1 Centralize Configuration
- [ ] Create `lib/constants.ts` for magic strings
- [ ] Move thread width, padding values to constants
- [ ] Move default suggestions to constants

**Files**: New `lib/constants.ts`, update consumers  
**Effort**: Low

### 2.2 Reduce Prop Drilling
- [ ] Add `suggestions` to AssistantStateContext
- [ ] Remove suggestions prop from intermediate components
- [ ] Update Thread and Composer to use context

**Files**: `components/assistant-ui/assistant-state-context.tsx`, `components/assistant-ui/thread.tsx`  
**Effort**: Medium

### 2.3 Add Loading States
- [ ] Add `isLoadingThread` to AssistantStateContext
- [ ] Show loading indicator during thread switch
- [ ] Add loading state to thread list

**Files**: `components/assistant-ui/assistant-state-context.tsx`, `components/MyAssistant.tsx`  
**Effort**: Low

### 2.4 Consistent Error Handling
- [ ] Create error handling utility/pattern
- [ ] Apply consistent try-catch to all async operations
- [ ] Document error handling strategy

**Files**: New `lib/error-utils.ts`, various  
**Effort**: Medium

---

## Priority 3: Nice to Have (Polish)

### 3.1 Migrate Suggestions to Official API
- [ ] Use `Suggestions()` API from `useAui`
- [ ] Update ThreadWelcomeSuggestions to use primitives
- [ ] Test suggestion behavior

**Files**: `components/assistant-ui/thread-welcome-suggestions.tsx`  
**Effort**: Medium  
**Reference**: `analysis/api-comparison.md`

### 3.2 Add Event Handlers
- [ ] Add `eventHandlers` to runtime config
- [ ] Use `onError` for better error handling
- [ ] Consider `onMessageChunk` for metadata

**Files**: `components/MyAssistant.tsx`  
**Effort**: Low

### 3.3 Replace Inline Styles
- [ ] Convert inline `style` props to Tailwind classes
- [ ] Ensure transitions work with Tailwind

**Files**: `components/assistant-ui/thread.tsx`  
**Effort**: Low

### 3.4 Add Tests
- [ ] Unit tests for `sanitizeMessages`
- [ ] Unit tests for `generateThreadTitle`
- [ ] Integration tests for thread operations

**Files**: New `__tests__/` folder  
**Effort**: High

---

## Priority 4: Documentation

### 4.1 Update README
- [ ] Document all custom features
- [ ] Add setup instructions
- [ ] Add architecture diagram

**Files**: `README.md`  
**Effort**: Medium

### 4.2 Add JSDoc Comments
- [ ] Document all exported functions
- [ ] Document component props
- [ ] Document context types

**Files**: All source files  
**Effort**: Medium

### 4.3 Create Migration Guide
- [ ] Document how to migrate from our template to official
- [ ] Document how to add our features to official template

**Files**: New `MIGRATION.md`  
**Effort**: Medium

---

## Upstream Contribution Candidates

Features to propose to assistant-ui team:

| Feature | File | Proposal Type |
|---------|------|---------------|
| Auto-scroll fix | `use-thread-auto-scroll.ts` | Bug fix |
| Message sanitization | `sanitizeMessages.ts` | Bug fix |
| Error display | `error-display.tsx` | New component |
| Canvas system | `canvas-*.tsx` | New feature |
| Thinking indicator | `thread.tsx` | Enhancement |
| User thread filtering | `chatApi.ts` | Pattern/docs |

---

## Quick Wins (< 30 min each)

- [ ] Remove duplicate CanvasProvider
- [ ] Add `lib/constants.ts`
- [ ] Add loading state to context
- [ ] Replace inline styles with Tailwind
- [ ] Add JSDoc to `sanitizeMessages.ts`

---

## Blocked / Needs Discussion

- **Cloud vs Custom Persistence**: Need to decide if we're targeting Assistant Cloud or custom LangGraph backend
- **Suggestions API**: Current approach works, migration may not be necessary
- **Tool Fallback**: Our version is more feature-rich than official, keep or align?
